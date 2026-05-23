from pydantic import BaseModel, Field
from typing import Optional


class ProfessionBase(BaseModel):
    name: str = Field(description="Название профессии")
    tags: str = Field(description="Теги через запятую — используются в алгоритме подбора")
    description: str = Field(description="Описание профессии")
    hh_query: str = Field(default="", description="Поисковый запрос для HH.ru")
    median_salary: Optional[float] = Field(default=None, description="Медианная зарплата")
    vacancies_count: Optional[int] = Field(default=None, description="Количество вакансий")
    top_skills: Optional[str] = Field(default=None, description="Топ навыков через запятую")


class ProfessionCreate(ProfessionBase):
    pass


class ProfessionUpdate(ProfessionBase):
    pass


class ProfessionResponse(ProfessionBase):
    id: int

    model_config = {"from_attributes": True}

class ProfessionsSeed(BaseModel):
    professions: list[ProfessionCreate]