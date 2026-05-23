from pydantic import BaseModel, Field
from typing import Optional
from app.models.questionnaire import QuestionType

class QuestionOptionBase(BaseModel):
    text: str = Field(description="Текст варианта ответа")
    trait: str | None = Field(
        default=None,
        description="Черта характера — используется в compute_trait_scores"
    )
    order: int = Field(ge=0, description="Порядок отображения")


class QuestionOptionCreate(QuestionOptionBase):
    pass

class OptionUpdate(QuestionOptionBase):
    id: Optional[int] = None

class QuestionOptionResponse(QuestionOptionBase):
    id: int
    question_id: int

    model_config = {"from_attributes": True}

class QuestionBase(BaseModel):
    text: str = Field(description="Текст вопроса")
    type: QuestionType = Field(description="Тип вопроса: single, multi, free_text")
    order: int = Field(ge=0, description="Порядок отображения")
    is_active: bool = Field(default=True)


class QuestionCreate(QuestionBase):
    options: list[QuestionOptionCreate] = Field(
        default=[],
        description="Варианты ответа — пустой список для free_text вопросов",
    )

    def model_post_init(self, __context) -> None:
        """Валидируем: у single/multi вопросов должны быть варианты."""
        if self.type in (QuestionType.SINGLE, QuestionType.MULTI) and not self.options:
            raise ValueError(
                f"Вопрос типа '{self.type}' должен иметь хотя бы один вариант ответа."
            )
        if self.type == QuestionType.FREE_TEXT and self.options:
            raise ValueError("Вопрос типа 'free_text' не должен иметь вариантов ответа.")


class QuestionUpdate(QuestionBase):
    options: list[OptionUpdate] = []

class QuestionResponse(QuestionBase):
    id: int
    options: list[QuestionOptionResponse] = []

    model_config = {"from_attributes": True}

class QuestionnaireSeed(BaseModel):
    questions: list[QuestionCreate] = Field(
        min_length=1,
        description="Список вопросов для заполнения опросника",
    )