from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class ExplainSource(str, Enum):
    TOPIC_DETAIL = "topic_detail"
    ROADMAP_OVERVIEW = "roadmap_overview"
    PROGRESS_PAGE = "progress_page"


class TopicExplainRequest(BaseModel):
    profession_id: int = Field(description="ID профессии для валидации контекста")
    source: ExplainSource = Field(
        default=ExplainSource.TOPIC_DETAIL,
        description="Откуда вызван ассистент (для аналитики и промпта)"
    )


class TopicExplainResponse(BaseModel):
    topic_id: int
    profession_id: int
    explanation: str
    cached: bool
    source: ExplainSource
    stale: bool = Field(default=False, description="True, если ответ из истёкшего кэша (LLM недоступна)")

class ChatMessageSchema(BaseModel):
    role: str  # "user" или "assistant"
    content: str

class ChatRequest(BaseModel):
    history: list[ChatMessageSchema]  # Передаем всю историю диалога
    profession_id: Optional[int] = None


class ChatResponse(BaseModel):
    response: str