from pydantic import BaseModel, Field, field_validator


class RecommendRequest(BaseModel):
    free_text: str = Field(
        min_length=20,
        max_length=1000,
        description="Свободный текст из опросника — чем занимаешься, что нравится",
        examples=["Люблю анализировать данные, строить графики и находить закономерности"],
    )
    traits: list[str] = Field(
        default=[],
        max_length=20,
        description="Черты характера из закрытых вопросов",
        examples=[["аналитическое мышление", "внимание к деталям"]],
    )

    @field_validator("free_text")
    @classmethod
    def text_must_not_be_empty_words(cls, v: str) -> str:
        """Отклоняем текст из одних пробелов или бессмысленных символов."""
        stripped = v.strip()
        if len(stripped) < 20:
            raise ValueError("Текст слишком короткий после удаления пробелов. Напиши подробнее.")
        return stripped

    @field_validator("traits")
    @classmethod
    def traits_must_be_non_empty_strings(cls, v: list[str]) -> list[str]:
        """Убираем пустые строки из списка черт."""
        cleaned = [t.strip() for t in v if t.strip()]
        return cleaned


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