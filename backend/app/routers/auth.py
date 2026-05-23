from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token, RefreshRequest
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    get_password_hash,
    decode_token,
)

router = APIRouter(prefix="/auth", tags=["Авторизация"])


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Регистрация нового пользователя"""
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Аутентификация пользователя. Возвращает access и refresh токены."""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "access_token": create_access_token(data={"sub": str(user.id)}),
        "refresh_token": create_refresh_token(data={"sub": str(user.id)}),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    body: RefreshRequest,   # ← именно так, не (refresh_token: str)
    db: AsyncSession = Depends(get_db),
):
    payload = decode_token(body.refresh_token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "access_token": create_access_token(data={"sub": str(user.id)}),
        "refresh_token": body.refresh_token,
        "token_type": "bearer",
    }