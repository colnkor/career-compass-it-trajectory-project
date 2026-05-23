from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.profession import Profession
from app.schemas.profession import ProfessionCreate, ProfessionUpdate, ProfessionResponse
from app.core.dependencies import get_current_admin

router = APIRouter(
    prefix="/admin/professions",
    tags=["Admin Professions CRUD"],
    dependencies=[Depends(get_current_admin)],
)


# 1. READ ALL
@router.get("/", response_model=list[ProfessionResponse])
async def get_professions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profession).order_by(Profession.name.asc()))
    return result.scalars().all()


# 2. CREATE
@router.post("/", response_model=ProfessionResponse, status_code=status.HTTP_201_CREATED)
async def create_profession(
    profession_in: ProfessionCreate,
    db: AsyncSession = Depends(get_db),
):
    # Проверка уникальности имени
    result = await db.execute(select(Profession).where(Profession.name == profession_in.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Профессия с таким названием уже существует",
        )

    db_profession = Profession(**profession_in.model_dump())
    db.add(db_profession)
    await db.commit()
    await db.refresh(db_profession)
    return db_profession


# 3. UPDATE
@router.put("/{profession_id}", response_model=ProfessionResponse)
async def update_profession(
    profession_id: int,
    profession_in: ProfessionUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Profession).where(Profession.id == profession_id))
    db_profession = result.scalar_one_or_none()

    if not db_profession:
        raise HTTPException(status_code=404, detail="Профессия не найдена")

    # Проверка уникальности имени (исключая текущую запись)
    if profession_in.name != db_profession.name:
        dup = await db.execute(select(Profession).where(Profession.name == profession_in.name))
        if dup.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Профессия с таким названием уже существует",
            )

    for key, value in profession_in.model_dump().items():
        setattr(db_profession, key, value)

    await db.commit()
    await db.refresh(db_profession)
    return db_profession


# 4. DELETE
@router.delete("/{profession_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profession(profession_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profession).where(Profession.id == profession_id))
    db_profession = result.scalar_one_or_none()

    if not db_profession:
        raise HTTPException(status_code=404, detail="Профессия не найдена")

    await db.delete(db_profession)
    await db.commit()