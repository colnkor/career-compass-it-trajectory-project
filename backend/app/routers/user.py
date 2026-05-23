from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.core.dependencies import get_current_user
from app.core.security import verify_password, get_password_hash

router = APIRouter(prefix="/users", tags=["Управление профилем"])

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Получение данных текущего пользователя"""
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Обновление данных текущего пользователя (почта, имя, пароль)"""
    # 1. Обновление имени
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name

    # 2. Обновление почты (с проверкой на уникальность)
    if user_data.email is not None and user_data.email != current_user.email:
        result = await db.execute(select(User).where(User.email == user_data.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = user_data.email

    # 3. Обновление пароля (требует подтверждения старого пароля)
    if user_data.new_password is not None:
        if not user_data.old_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Old password is required to change password"
            )
        if not verify_password(user_data.old_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect old password"
            )
        current_user.hashed_password = get_password_hash(user_data.new_password)

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Удаление аккаунта текущего пользователя"""
    await db.delete(current_user)
    await db.commit()
    return None