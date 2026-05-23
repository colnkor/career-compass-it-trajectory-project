from pydantic import BaseModel, Field
from typing import Optional

class RoadmapTopicAuto(BaseModel):
    title: str = Field(description="Название темы")
    description: Optional[str] = Field(default=None, description="Описание темы")
    resources: Optional[str] = Field(default=None, description="Ссылки через запятую")
    order: int = Field(ge=0, description="Порядок в дорожной карте")

class RoadmapTopicBase(RoadmapTopicAuto):
    phase_id: int = Field(description="ID профессии")


class RoadmapTopicCreate(RoadmapTopicBase):
    pass


class RoadmapTopicUpdate(RoadmapTopicBase):
    pass


class RoadmapTopicResponse(RoadmapTopicBase):
    id: int

    model_config = {"from_attributes": True}

class RoadmapPhaseBase(BaseModel):
    profession_id: int = Field(description="ID профессии")
    title: str = Field(description="Название темы")
    description: Optional[str] = Field(default=None, description="Описание темы")
    order: int = Field(ge=0, description="Порядок в дорожной карте")


class RoadmapPhaseCreate(RoadmapPhaseBase):
    pass

class RoadmapPhaseCreateFull(RoadmapPhaseCreate):
    topics: list[RoadmapTopicAuto]

class RoadmapPhaseUpdate(RoadmapPhaseBase):
    pass


class RoadmapPhaseResponse(RoadmapPhaseBase):
    id: int

    model_config = {"from_attributes": True}

class RoadmapSeed(BaseModel):
    phases: list[RoadmapPhaseCreateFull] = Field(
        min_length=1,
        description="Список вопросов для заполнения опросника",
    )