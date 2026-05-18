from fastapi import APIRouter, HTTPException
from app.ml.state import ml_models

router = APIRouter(prefix="/recommend", tags=["Рекомендации"])


@router.post("/")
async def recommend_professions(answers: dict):
    """
    Принимает ответы опросника, возвращает топ-3 профессии.

    Тело запроса:
    {
        "free_text": "люблю математику и данные",  # для TF-IDF
        "traits": ["аналитическое мышление", "внимание к деталям"]  # для весов
    }
    """
    if not ml_models.is_ready:
        raise HTTPException(
            status_code=503,
            detail="ML модели ещё не загружены. Попробуйте позже."
        )

    # TODO: здесь будет логика TF-IDF + KNN + веса
    return {"professions": [], "message": "В разработке"}