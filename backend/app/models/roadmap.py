from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.profession import Profession

class RoadmapPhase(Base):
    __tablename__ = "roadmap_phases"

    id = Column(Integer, primary_key=True, index=True)
    profession_id = Column(Integer, ForeignKey("professions.id"), nullable=False)
    title = Column(String, nullable=False)       # Например, "Фаза 1: Основы Python"
    description = Column(Text, nullable=True)    # Краткое описание целей фазы
    order = Column(Integer, nullable=False)      # Порядок отображения фазы

    # Связи
    profession = relationship("Profession", back_populates="roadmap_phases")
    topics = relationship(
        "RoadmapTopic", 
        back_populates="phase",
        cascade="all, delete", 
        order_by="RoadmapTopic.order"
    )


class RoadmapTopic(Base):
    __tablename__ = "roadmap_topics"

    id = Column(Integer, primary_key=True, index=True)
    phase_id = Column(Integer, ForeignKey("roadmap_phases.id"), nullable=False)
    title = Column(String, nullable=False)       # Например, "Переменные и типы данных"
    description = Column(Text, nullable=True)    # Подробное описание темы
    resources = Column(Text, nullable=True)      # Полезные ссылки через запятую
    order = Column(Integer, nullable=False)      # Порядок темы внутри её фазы
    
    # Связи
    phase = relationship("RoadmapPhase", back_populates="topics")
    user_progress = relationship("UserProgress", back_populates="topic")