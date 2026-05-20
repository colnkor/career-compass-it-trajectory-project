from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.ml.state import ml_models
from app.routers import health, recommend, professions, roadmap, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Создаём таблицы если их нет
    print("Инициализация базы данных...")
    await init_db()
 
    # 2. Загружаем ML модели в память
    print("Загружаем ML модели...")
    await ml_models.load()
    print("Приложение готово к работе")
 
    yield
 
    print("Остановка — очищаем ресурсы...")
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

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(recommend.router)
app.include_router(professions.router)
app.include_router(roadmap.router)