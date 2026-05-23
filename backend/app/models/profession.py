from sqlalchemy import Column, Integer, String, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Profession(Base):
    __tablename__ = "professions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    tags = Column(Text, nullable=False)
    description = Column(Text)
    hh_query = Column(String)

    median_salary = Column(Float, nullable=True)
    vacancies_count = Column(Integer, nullable=True)
    top_skills = Column(Text, nullable=True)

    # Связи
    progress = relationship("UserProgress", back_populates="profession")
    
    roadmap_phases = relationship(
        "RoadmapPhase", 
        back_populates="profession",
        cascade="all, delete", 
        order_by="RoadmapPhase.order"
    )