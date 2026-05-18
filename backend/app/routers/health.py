from fastapi import APIRouter
from app.ml.state import ml_models

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """
    Проверка состояния сервиса.
    Показывает, запущено ли приложение и готовы ли ML модели.
    """
    return {
        "status": "ok",
        "ml_models_ready": ml_models.is_ready,
    }