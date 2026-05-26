from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.ml.state import ml_models
from app.models.questionnaire import QuestionOption
from app.schemas.recommend import Answer, RecommendRequest, RecommendResponse, ProfessionMatch

router = APIRouter(prefix="/recommend", tags=["Рекомендации"])

TRAIT_TO_PROFESSION = {
    'Frontend':     'Frontend-разработчик',
    'Backend':      'Backend-разработчик',
    'Fullstack':    'Fullstack-разработчик',
    'Data Analyst': 'Аналитик данных',
    'ML':           'ML-разработчик',
    'Android':      'Android-разработчик',
    'iOS':          'iOS-разработчик',
    'UI/UX':        'UI/UX дизайнер',
    'QA':           'QA-инженер',
    'DevOps':       'DevOps-инженер',
}

async def compute_trait_scores(answers: list[Answer], db: AsyncSession) -> dict[str, float]:
    """
    Вычисляет нормализованный профиль трейтов пользователя из закрытых ответов.
    Учитывает веса трейтов, записанные через двоеточие и разделенные ';'
    """
    # Собираем все option_ids из всех закрытых ответов
    all_option_ids = [oid for answer in answers for oid in answer.option_ids]
    if not all_option_ids:
        return {}

    # Получаем сырые строки трейтов из БД
    stmt = select(QuestionOption.trait).where(QuestionOption.id.in_(all_option_ids))
    result = await db.execute(stmt)
    trait_strings = result.scalars().all()

    # Аккумулируем ВЕСА каждого трейта
    scores: dict[str, float] = {}
    
    for trait_str in trait_strings:
        if not trait_str:
            continue
        
        # Разделяем строку вида "Frontend:2.0;UI/UX:2.0;Fullstack:0.5" на отдельные компоненты
        components = trait_str.split(";")
        for component in components:
            if ":" in component:
                trait_name, weight_str = component.split(":", 1)
                try:
                    weight = float(weight_str)
                    scores[trait_name] = scores.get(trait_name, 0.0) + weight
                except ValueError:
                    # На случай, если в БД записан некорректный float
                    continue

    if not scores:
        return {}

    # Нормализуем веса (деление на сумму всех набранных весов)
    mapped = {TRAIT_TO_PROFESSION.get(k, k): v for k, v in scores.items()}
    total = sum(mapped.values())
    return {k: v / total for k, v in mapped.items()} if total > 0 else {}


@router.post("/", response_model=RecommendResponse)
async def recommend_professions(
    request: RecommendRequest,
    db: AsyncSession = Depends(get_db),
) -> RecommendResponse:
    """
    Принимает ответы опросника, возвращает топ-3 подходящих профессии.

    - **free_text**: свободный текст (минимум 20 символов)
    - **answers**: список ответов на все вопросы опросника.
    """
    if not ml_models.is_ready:
        raise HTTPException(
            status_code=503,
            detail="ML модели ещё не загружены. Попробуйте позже.",
        )

    # Извлекаем текст из открытого вопроса
    texts_from_answers = [
        a.free_text.strip() 
        for a in request.answers 
        if a.free_text and a.free_text.strip()
    ]

    if not texts_from_answers:
        raise HTTPException(
            status_code=422,
            detail="Не найден ответ на открытый вопрос.",
        )

    free_text_answer = " ".join(texts_from_answers)

    # Вычисляем трейт-профиль (добавлен await, так как функция стала асинхронной)
    trait_scores = await compute_trait_scores(request.answers, db)

    # Запускаем пайплайн (оставляем без изменений, если метод синхронный)
    result = ml_models.recommender.get_result(
        user_text=free_text_answer,
        trait_scores=trait_scores or None,  # None если нет трейто
    )

    return RecommendResponse(
        status=result.status,
        reason=result.reason,
        professions=[
            ProfessionMatch(name=p["name"], confidence=p["confidence"])
            for p in result.professions
        ],
    )
