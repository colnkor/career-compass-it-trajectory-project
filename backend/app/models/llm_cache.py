from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from app.database import Base


class LLMCache(Base):
    __tablename__ = "llm_cache"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("roadmap_topics.id", ondelete="CASCADE"), nullable=False)
    profession_id = Column(Integer, ForeignKey("professions.id", ondelete="CASCADE"), nullable=False)
    source = Column(String(100), nullable=False)
    response_text = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    __table_args__ = (
        Index("ix_llm_cache_user_topic", "user_id", "topic_id", unique=True),
    )