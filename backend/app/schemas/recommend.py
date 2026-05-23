from pydantic import BaseModel, Field, field_validator

class Answer(BaseModel):
    question_id: int
    option_ids: list[int] = Field(default=[])
    free_text: str | None = Field(default=None)

class RecommendRequest(BaseModel):
    free_text: str = Field(
        min_length=20,
        max_length=1000,
        description="Свободный текст из опросника — чем занимаешься, что нравится",
        examples=["Люблю анализировать данные, строить графики и находить закономерности"],
    )
    answers: list[Answer] = Field(min_length=1)

    @field_validator("free_text")
    @classmethod
    def text_must_not_be_empty_words(cls, v: str) -> str:
        """Отклоняем текст из одних пробелов или бессмысленных символов."""
        stripped = v.strip()
        if len(stripped) < 20:
            raise ValueError("Текст слишком короткий после удаления пробелов. Напиши подробнее.")
        return stripped

    @field_validator("answers")
    @classmethod
    def validate_answers_list(cls, v: list[Answer]) -> list[Answer]:
        """Проверяем список ответов на уникальность вопросов и заполненность."""
        seen_questions = set()
        
        for answer in v:
            # 1. Проверка на дубликаты ID вопросов
            if answer.question_id in seen_questions:
                raise ValueError(f"Обнаружен дубликат ответа для question_id {answer.question_id}.")
            seen_questions.add(answer.question_id)
            
            # 2. Проверка, что передан хоть какой-то ответ (опции или текст)
            has_options = len(answer.option_ids) > 0
            has_text = answer.free_text is not None and bool(answer.free_text.strip())
            
            if not (has_options or has_text):
                raise ValueError(
                    f"Ответ для question_id {answer.question_id} не может быть пустым. "
                    f"Заполните либо option_ids, либо free_text."
                )
                
        return v


class ProfessionMatch(BaseModel):
    name: str
    confidence: float = Field(ge=0.0, le=1.0)


class RecommendResponse(BaseModel):
    status: str = Field(description="accepted или rejected")
    reason: str | None = Field(
        default=None,
        description="Причина отклонения если status=rejected",
    )
    professions: list[ProfessionMatch] = Field(
        default=[],
        description="Топ-3 профессии с confidence score",
    )