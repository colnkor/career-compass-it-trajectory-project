from fastapi import APIRouter

router = APIRouter(prefix="/roadmap", tags=["Дорожная карта"])


@router.get("/{profession_id}")
async def get_roadmap(profession_id: int):
    """
    Дорожная карта для профессии.
    Темы генерируются через LLM API.
    """
    # TODO: генерация через LLM
    return {"profession_id": profession_id, "topics": [], "message": "В разработке"}


@router.post("/progress")
async def save_progress(data: dict):
    """Сохраняет прогресс пользователя по дорожной карте."""
    # TODO: сохранение в БД
    return {"message": "В разработке"}