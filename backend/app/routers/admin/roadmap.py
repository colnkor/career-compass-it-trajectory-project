from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.roadmap import RoadmapPhase, RoadmapTopic
from app.models.profession import Profession

# Импортируйте ваши обновленные схемы (укажите правильный путь к модулю схем)
from app.schemas.roadmap import (
    RoadmapPhaseCreate,
    RoadmapPhaseUpdate,
    RoadmapPhaseResponse,
    RoadmapTopicCreate,
    RoadmapTopicUpdate,
    RoadmapTopicResponse,
)
from app.core.dependencies import get_current_admin

router = APIRouter(
    prefix="/admin/roadmap",
    tags=["Admin Roadmap CRUD"],
    dependencies=[Depends(get_current_admin)],
)


# =============================================================================
# ─── CRUD ДЛЯ ФАЗ (ROADMAP PHASES) ───────────────────────────────────────────
# =============================================================================

# 1. READ ALL (с возможностью фильтрации по profession_id)
@router.get("/phases", response_model=list[RoadmapPhaseResponse])
async def get_phases(
    profession_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(RoadmapPhase).order_by(RoadmapPhase.profession_id, RoadmapPhase.order)
    if profession_id is not None:
        query = query.where(RoadmapPhase.profession_id == profession_id)
    result = await db.execute(query)
    return result.scalars().all()


# 2. CREATE PHASE
@router.post("/phases", response_model=RoadmapPhaseResponse, status_code=status.HTTP_201_CREATED)
async def create_phase(
    phase_in: RoadmapPhaseCreate,
    db: AsyncSession = Depends(get_db),
):
    # Проверяем, существует ли привязываемая профессия
    prof_check = await db.execute(select(Profession).where(Profession.id == phase_in.profession_id))
    if not prof_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Указанная профессия не найдена")

    db_phase = RoadmapPhase(**phase_in.model_dump())
    db.add(db_phase)
    await db.commit()
    await db.refresh(db_phase)
    return db_phase


# 3. UPDATE PHASE
@router.put("/phases/{phase_id}", response_model=RoadmapPhaseResponse)
async def update_phase(
    phase_id: int,
    phase_in: RoadmapPhaseUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(RoadmapPhase).where(RoadmapPhase.id == phase_id))
    db_phase = result.scalar_one_or_none()
    if not db_phase:
        raise HTTPException(status_code=404, detail="Фаза не найдена")

    # Проверяем профессию, если профессия в запросе изменилась
    if phase_in.profession_id != db_phase.profession_id:
        prof_check = await db.execute(select(Profession).where(Profession.id == phase_in.profession_id))
        if not prof_check.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Указанная профессия не найдена")

    for key, value in phase_in.model_dump().items():
        setattr(db_phase, key, value)

    await db.commit()
    await db.refresh(db_phase)
    return db_phase


# 4. DELETE PHASE (Каскадно удалит и связанные темы благодаря cascade="all, delete" в модели)
@router.delete("/phases/{phase_id}")
async def delete_phase(phase_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RoadmapPhase).where(RoadmapPhase.id == phase_id))
    db_phase = result.scalar_one_or_none()
    if not db_phase:
        raise HTTPException(status_code=404, detail="Фаза не найдена")
        
    await db.delete(db_phase)
    await db.commit()
    return {"detail": "Фаза и все связанные с ней темы успешно удалены"}


# =============================================================================
# ─── CRUD ДЛЯ ТЕМ (ROADMAP TOPICS) ───────────────────────────────────────────
# =============================================================================

# 1. READ ALL (с возможностью фильтрации по phase_id)
@router.get("/topics", response_model=list[RoadmapTopicResponse])
async def get_topics(
    phase_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(RoadmapTopic).order_by(RoadmapTopic.phase_id, RoadmapTopic.order)
    if phase_id is not None:
        query = query.where(RoadmapTopic.phase_id == phase_id)
    result = await db.execute(query)
    return result.scalars().all()


# 2. CREATE TOPIC
@router.post("/topics", response_model=RoadmapTopicResponse, status_code=status.HTTP_201_CREATED)
async def create_topic(
    topic_in: RoadmapTopicCreate,
    db: AsyncSession = Depends(get_db),
):
    # Теперь тема проверяет и привязывается к phase_id, а не к profession_id напрямую
    phase_check = await db.execute(select(RoadmapPhase).where(RoadmapPhase.id == topic_in.phase_id))
    if not phase_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Указанная родительская фаза не найдена")

    db_topic = RoadmapTopic(**topic_in.model_dump())
    db.add(db_topic)
    await db.commit()
    await db.refresh(db_topic)
    return db_topic


# 3. UPDATE TOPIC
@router.put("/topics/{topic_id}", response_model=RoadmapTopicResponse)
async def update_topic(
    topic_id: int,
    topic_in: RoadmapTopicUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(RoadmapTopic).where(RoadmapTopic.id == topic_id))
    db_topic = result.scalar_one_or_none()
    if not db_topic:
        raise HTTPException(status_code=404, detail="Тема не найдена")

    # Проверяем фазу, если phase_id изменился
    if topic_in.phase_id != db_topic.phase_id:
        phase_check = await db.execute(select(RoadmapPhase).where(RoadmapPhase.id == topic_in.phase_id))
        if not phase_check.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Указанная родительская фаза не найдена")

    for key, value in topic_in.model_dump().items():
        setattr(db_topic, key, value)

    await db.commit()
    await db.refresh(db_topic)
    return db_topic


# 4. DELETE TOPIC
@router.delete("/topics/{topic_id}")
async def delete_topic(topic_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RoadmapTopic).where(RoadmapTopic.id == topic_id))
    db_topic = result.scalar_one_or_none()
    if not db_topic:
        raise HTTPException(status_code=404, detail="Тема не найдена")
        
    await db.delete(db_topic)
    await db.commit()
    return {"detail": "Тема успешно удалена"}