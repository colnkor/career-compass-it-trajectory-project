from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.ml.state import ml_models
from app.seed import seed_admin
from app.services.llm_service import init_service as init_llm
from app.routers import health, recommend, professions, roadmap, auth, questionnaire, user
import app.routers.admin.questions as adm_questionnaire
import app.routers.admin.professions as adm_professions
import app.routers.admin.roadmap as adm_roadmap

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Создаём таблицы если их нет
    print("Инициализация базы данных...")
    await init_db()
 
    print("Создание администратора...")
    await seed_admin()

    # 2. Загружаем ML модели в память
    print("Загружаем ML модели...")
    await ml_models.load()

    print("Поднимаю LLMService")
    with open("app/services/data/default_sysprmt.txt", "r", encoding="utf-8") as f:
        await init_llm(f.read())

    print("Приложение готово к работе")

    yield
 
    print("Остановка — очищаем ресурсы...")
    ml_models.clear()

app = FastAPI(
    title="Карьерный компас",
    description="Сервис подбора IT-профессий и построения дорожной карты",
    version="0.1.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:443", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(recommend.router)
app.include_router(professions.router)
app.include_router(roadmap.router)
app.include_router(questionnaire.router)
app.include_router(adm_questionnaire.router)
app.include_router(adm_professions.router)
app.include_router(adm_roadmap.router)