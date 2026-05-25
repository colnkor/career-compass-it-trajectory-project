from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.profession import Profession
from app.core.dependencies import get_current_user
from app.services import llm_service
from app.core.rate_limiter import SlidingWindowRateLimiter
from app.schemas.llm import ChatRequest, ChatResponse
from app.services.topic_explainer import build_user_progress_summary

router = APIRouter(prefix="/llm", tags=["Интерактивный чат с ИИ"])

# Новый ограничитель запросов специально для чата
chat_rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60)

# --- Вспомогательная функция сборки контекста ---
async def _build_chat_user_context(db: AsyncSession, user: User, profession_id: Optional[int]) -> str:
    context_lines = [
        f"Имя ученика: {user.full_name}",
    ]
    
    if profession_id:
        # 1. Извлекаем название профессии
        prof_result = await db.execute(select(Profession).where(Profession.id == profession_id))
        profession = prof_result.scalar_one_or_none()
        if profession:
            context_lines.append(f"Текущий образовательный трек: {profession.name}")
        
        # 2. Делегируем сборку прогресса проверенной функции из эксплейнера
        progress_summary = await build_user_progress_summary(db, user.id, profession_id)
        context_lines.append(f"Прогресс: {progress_summary}")
    else:
        context_lines.append("В данный момент глобальный трек профессии не выбран (общий диалог).")
        
    return "\n".join(context_lines)


# --- Эндпоинт чата ---
@router.post(
    "/talkto", 
    response_model=ChatResponse, 
    summary="Свободный диалог с ИИ-ментором с учетом контекста"
)
async def talk_to_mentor(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Проверка Rate Limiting (защита от спама в чат)
    chat_rate_limiter.check(current_user.id)
    
    # 2. Проверка инициализации LLM
    if llm_service.llm_service is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="LLM-сервис еще не запущен на сервере."
        )
        
    # 3. Асинхронно собираем бэкграунд пользователя
    user_context = await _build_chat_user_context(db, current_user, payload.profession_id)
    
    # 4. Объединяем глобальный системный промпт сервера с динамическим контекстом
    base_system_prompt = llm_service.llm_service.system_prompt
    
    dynamic_system_prompt = (
        f"{base_system_prompt}\n\n"
        f"=== АКТУАЛЬНЫЙ ПРОФИЛЬ СТУДЕНТА ===\n"
        f"{user_context}\n"
        f"===================================\n"
        f"Используй эти данные, чтобы адаптировать сложность ответов, приводить понятные "
        f"аналогии из пройденного материала и мотивировать ученика. Отвечай на его сообщение."
    )
    
  # Конвертируем Pydantic-модели истории в обычные dict для httpx
    formatted_history = [msg.model_dump() for msg in payload.history]

    # 5. Отправляем запрос в GigaChat
    try:
        ai_response = await llm_service.llm_service.get_answer_chat(
            messages=formatted_history,
            shadow_sys=dynamic_system_prompt
        )
    except Exception as e:
        print(f'LLM error: {e}')
        # Здесь логгер зафиксирует ошибку GigaChat/сертификатов при необходимости
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="ИИ-наставник временно задумался. Пожалуйста, повторите вопрос через минуту."
        )
        
    return ChatResponse(response=ai_response)