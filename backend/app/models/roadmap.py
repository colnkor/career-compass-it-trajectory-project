from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class RoadmapTopic(Base):
    __tablename__ = "roadmap_topics"

    id = Column(Integer, primary_key=True, index=True)
    profession_id = Column(Integer, ForeignKey("professions.id"), nullable=False)
    title = Column(String, nullable=False)       # "Основы Python"
    description = Column(Text, nullable=True)    # вводная, генерируется LLM
    resources = Column(Text, nullable=True)      # ссылки через запятую
    order = Column(Integer, nullable=False)      # порядок в дорожной карте
    
    profession = relationship("Profession", back_populates="roadmap_topics")
    user_progress = relationship("UserProgress", back_populates="topic")
