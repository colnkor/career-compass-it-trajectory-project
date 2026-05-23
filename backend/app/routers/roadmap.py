from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import delete
from sqlalchemy.future import select
from datetime import datetime, timezone 

from app.database import get_db
from app.models.roadmap import RoadmapPhase, RoadmapTopic
from app.schemas.llm import TopicExplainRequest, TopicExplainResponse
from app.core.rate_limiter import explain_rate_limiter
from app.services.topic_explainer import explain_topic
from app.services import llm_cache_service
from app.models.progress import UserProgress
from app.models.user import User
from app.schemas.progress import ProgressUpdateRequest
from app.schemas.roadmap import RoadmapSeed
from app.core.dependencies import get_current_user 


router = APIRouter(prefix="/roadmap", tags=["Дорожная карта"])


@router.get("/{profession_id}")
async def get_roadmap(
    profession_id: int,
    db: AsyncSession = Depends(get_db)
    ):
    """
    Дорожная карта для профессии.
    """
    result = await db.execute(
        select(RoadmapPhase)
        .where(RoadmapPhase.profession_id == profession_id)
        .options(selectinload(RoadmapPhase.topics))
        .order_by(RoadmapPhase.order)
    )
    phases = result.scalars().all()

    if not phases:
        raise HTTPException(
            status_code=404,
            detail="Roadmap ещё не заполнен. Администратор должен загрузить дорожные карты через /roadmap/seed.",
        )

    return phases

@router.post("/seed", response_model=dict, status_code=201)
async def seed_questionnaire(
    payload: RoadmapSeed,
    db: AsyncSession = Depends(get_db),
#    admin: User = Depends(get_current_admin)
) -> dict:
    await db.execute(delete(RoadmapTopic))
    await db.execute(delete(RoadmapPhase))
    await db.commit()

    for p_data in payload.phases:
        phase = RoadmapPhase(
            profession_id = p_data.profession_id,
            title = p_data.title,
            description = p_data.description,
            order = p_data.order,
        )
        db.add(phase)
        await db.flush()

        for top_data in p_data.topics:
            topic = RoadmapTopic(
                phase_id = phase.id,
                title = top_data.title,
                description = top_data.description,
                resources = top_data.resources,
                order = top_data.order,
            )
            db.add(topic)

        await db.commit()

    return {
        "message": f"Дорожная карта успешно загружена.",
        "phases_created": len(payload.phases),
    }

@router.post("/progress", response_model=dict)
async def save_progress(
    data: ProgressUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Валидация: проверяем, что тема существует и принадлежит указанной профессии
    topic_check = await db.execute(
        select(RoadmapTopic).join(RoadmapPhase).where(
            RoadmapTopic.id == data.topic_id,
            RoadmapPhase.profession_id == data.profession_id
        )
    )
    if not topic_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Тема не найдена или не принадлежит указанной профессии"
        )

    # 2. Поиск существующей записи прогресса
    result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == current_user.id,
            UserProgress.profession_id == data.profession_id,
            UserProgress.topic_id == data.topic_id
        )
    )
    progress = result.scalar_one_or_none()

    # 3. Логика Upsert (Update or Insert)
    if progress:
        progress.is_completed = data.is_completed
        if data.is_completed and not progress.completed_at:
            progress.completed_at = datetime.now(timezone.utc)
        elif not data.is_completed:
            progress.completed_at = None  # Сбрасываем дату при отмене выполнения
        # updated_at обновится автоматически благодаря onupdate=func.now() в модели
    else:
        progress = UserProgress(
            user_id=current_user.id,
            profession_id=data.profession_id,
            topic_id=data.topic_id,
            is_completed=data.is_completed,
            completed_at=datetime.now(timezone.utc) if data.is_completed else None
        )
        db.add(progress)

    await db.commit()
    await db.refresh(progress)

    return {
        "message": "Прогресс успешно сохранён",
        "data": {
            "id": progress.id,
            "topic_id": progress.topic_id,
            "is_completed": progress.is_completed,
            "completed_at": progress.completed_at,
            "updated_at": progress.updated_at
        }
    }

@router.post(
    "/topic/{topic_id}/explain",
    response_model=TopicExplainResponse,
    summary="Подробное объяснение темы от LLM-наставника",
)
async def explain_topic_endpoint(
    topic_id: int,
    payload: TopicExplainRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Rate limiting
    explain_rate_limiter.check(current_user.id)

    # 2. Пытаемся взять из кэша (свежий)
    cached, is_stale = await llm_cache_service.get_cached(
        db, current_user.id, topic_id, allow_stale=False
    )
    if cached and not is_stale:
        return TopicExplainResponse(
            topic_id=topic_id,
            profession_id=payload.profession_id,
            explanation=cached.response_text,
            cached=True,
            source=payload.source,
            stale=False,
        )

    # 3. Вызываем LLM
    try:
        explanation = await explain_topic(
            db=db,
            user=current_user,
            topic_id=topic_id,
            profession_id=payload.profession_id,
            source=payload.source.value,
        )
    except ValueError as e:
        # Ошибка валидации (тема не принадлежит профессии и т.п.)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"ERROR LLM: {e}")

        # 4. Fallback: отдаём stale-кэш, если есть
        stale_entry, _ = await llm_cache_service.get_cached(
            db, current_user.id, topic_id, allow_stale=True
        )
        if stale_entry:
            return TopicExplainResponse(
                topic_id=topic_id,
                profession_id=payload.profession_id,
                explanation=stale_entry.response_text,
                cached=True,
                source=payload.source,
                stale=True,
            )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM-сервис временно недоступен. Попробуйте позже.",
        )

    # 5. Сохраняем в кэш
    await llm_cache_service.set_cached(
        db=db,
        user_id=current_user.id,
        topic_id=topic_id,
        profession_id=payload.profession_id,
        source=payload.source.value,
        response_text=explanation,
    )

    return TopicExplainResponse(
        topic_id=topic_id,
        profession_id=payload.profession_id,
        explanation=explanation,
        cached=False,
        source=payload.source,
        stale=False,
    )