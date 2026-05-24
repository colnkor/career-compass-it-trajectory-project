from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from sqlalchemy.future import select

from app.database import get_db
from app.core.dependencies import get_current_admin
from app.models.profession import Profession
from app.models.user import User
from app.schemas.profession import ProfessionsSeed, ProfessionResponse

router = APIRouter(prefix="/professions", tags=["Профессии"])


@router.get("/")
async def list_professions(db: AsyncSession = Depends(get_db)):
    """Список всех доступных профессий."""
    
    # 1. Делаем асинхронный запрос к таблице профессий
    stmt = select(Profession)
    result = await db.execute(stmt)
    professions_list = result.scalars().all()
    
    if not professions_list:
        return {
            "professions": [
                {"id": 1, "name": "Frontend-разработчик", "description": "Создает интерфейсы"},
                {"id": 2, "name": "UI/UX дизайнер", "description": "Проектирует пользовательский опыт"},
                {"id": 3, "name": "iOS-разработчик", "description": "Разрабатывает под Apple устройства"},
            ]
        }
        
    return {"professions": professions_list}

@router.get("/{profession_id}")
async def get_profession(
    profession_id: int, db: AsyncSession = Depends(get_db)
) -> ProfessionResponse:
    # 1. Получаем профессию из БД по ID
    stmt = select(Profession).where(Profession.id == profession_id)
    res = await db.execute(stmt)
    profession = res.scalar_one_or_none()

    # 2. Если такой профессии нет — отдаем 404
    if not profession:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профессия не найдена",
        )
    
    return profession

@router.get("/{profession_id}/market")
async def profession_market(
    profession_id: int, db: AsyncSession = Depends(get_db)
):
    """Возвращает аналитические данные рынка по профессии напрямую из БД."""
    # 1. Получаем профессию из БД по ID
    stmt = select(Profession).where(Profession.id == profession_id)
    res = await db.execute(stmt)
    profession = res.scalar_one_or_none()

    # 2. Если такой профессии нет — отдаем 404
    if not profession:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профессия не найдена",
        )

    # 3. Отдаем чистые данные из модели
    return {
        "id": profession.id,
        "name": profession.name,
        "vacancies_count": profession.vacancies_count,
        "median_salary": profession.median_salary,
        "top_skills": profession.top_skills,
        "hh_query": profession.hh_query,
        "vacancies": [],  # Пустой список, так как внешние запросы отключены
    }

@router.post("/seed", response_model=dict, status_code=201)
async def seed_professions(
    payload: ProfessionsSeed,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> dict:
    """
    Заполняет базу данных профессиями из переданного JSON.
    Полностью заменяет существующие профессии — идемпотентная операция.
    
    Внимание: каскадно удалит связанные фазы и темы дорожных карт!
    """
    # 1. Удаляем все старые профессии (cascade удалит связанные roadmap_phases)
    await db.execute(delete(Profession))

    # 2. Создаем новые записи на основе пришедших данных
    for p_data in payload.professions:
        profession = Profession(
            name=p_data.name,
            tags=p_data.tags,
            description=p_data.description,
            hh_query=p_data.hh_query,
            median_salary=p_data.median_salary,
            vacancies_count=p_data.vacancies_count,
            top_skills=p_data.top_skills,
        )
        db.add(profession)

    # 3. Сохраняем изменения в базе данных
    await db.commit()

    return {
        "message": "Список профессий успешно обновлен.",
        "professions_created": len(payload.professions),
    }