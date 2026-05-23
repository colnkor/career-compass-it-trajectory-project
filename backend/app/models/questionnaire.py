import enum
from sqlalchemy import String, Text, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base

class QuestionType(str, enum.Enum):
    SINGLE = "single"
    MULTI = "multi"
    FREE_TEXT = "free_text"

class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[QuestionType] = mapped_column(Enum(QuestionType), nullable=False)
    order: Mapped[int] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    options: Mapped[list["QuestionOption"]] = relationship(
        "QuestionOption", 
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuestionOption.order" 
    )

class QuestionOption(Base):
    __tablename__ = "question_options"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), 
        nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    trait: Mapped[str] = mapped_column(String(255), nullable=True) # ???
    order: Mapped[int] = mapped_column(nullable=False)
    question: Mapped["Question"] = relationship("Question", back_populates="options")