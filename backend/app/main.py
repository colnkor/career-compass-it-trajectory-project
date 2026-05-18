from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ml.state import ml_models
from app.routers import health, recommend, professions, roadmap, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Выполняется один раз при старте приложения.
    Здесь загружаем ML модели в память — чтобы не делать это на каждый запрос.
    Обучать модели здесь не нужно, только загружать готовые файлы.
    """
    print("Запуск приложения — загружаем ML модели...")
    await ml_models.load()
    print("Модели загружены, приложение готово к работе")

    yield

    print("Остановка приложения — очищаем ресурсы...")
    ml_models.clear()


app = FastAPI(
    title="Карьерный компас",
    description="Сервис подбора IT-профессий и построения дорожной карты",
    version="0.1.0",
    lifespan=lifespan,
)

@app.get("/")
def read_root():
    return {"message": "Привет, мир! Это простое FastAPI приложение"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(recommend.router)
app.include_router(professions.router)
app.include_router(roadmap.router)