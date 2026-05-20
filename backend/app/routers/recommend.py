from fastapi import APIRouter, HTTPException
from app.ml.state import ml_models
from app.schemas.recommend import RecommendRequest, RecommendResponse, ProfessionMatch

router = APIRouter(prefix="/recommend", tags=["Рекомендации"])


@router.post("/", response_model=RecommendResponse)
async def recommend_professions(request: RecommendRequest) -> RecommendResponse:
    """
    Принимает ответы опросника, возвращает топ-3 подходящих профессии.

    - **free_text**: свободный текст (минимум 20 символов)
    - **traits**: список черт из закрытых вопросов (опционально, пока в разработке)
    """
    if not ml_models.is_ready:
        raise HTTPException(
            status_code=503,
            detail="ML модели ещё не загружены. Попробуйте позже.",
        )

    result = ml_models.recommender.get_result(request.free_text)

    return RecommendResponse(
        status=result.status,
        reason=result.reason,
        professions=[
            ProfessionMatch(name=p["name"], confidence=p["confidence"])
            for p in result.professions
        ],
    )