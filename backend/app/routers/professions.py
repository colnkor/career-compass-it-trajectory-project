from fastapi import APIRouter

router = APIRouter(prefix="/professions", tags=["Профессии"])


@router.get("/")
async def list_professions():
    """Список всех доступных профессий."""
    # TODO: вернуть из БД
    return {"professions": [], "message": "В разработке"}


@router.get("/{profession_id}/market")
async def profession_market(profession_id: int):
    """Данные рынка по профессии: вакансии, медиана, топ-скиллы (hh.ru API)."""
    # TODO: запрос к hh.ru API
    return {"profession_id": profession_id, "message": "В разработке"}