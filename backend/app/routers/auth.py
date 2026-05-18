from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["Авторизация"])


@router.post("/register")
async def register(data: dict):
    """Регистрация нового пользователя."""
    # TODO: хеширование пароля + сохранение в БД
    return {"message": "В разработке"}


@router.post("/login")
async def login(data: dict):
    """Вход и получение JWT токена."""
    # TODO: проверка пароля + выдача токена
    return {"message": "В разработке"}