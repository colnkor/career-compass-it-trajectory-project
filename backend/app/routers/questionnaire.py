from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.core.dependencies import get_current_admin
from app.database import get_db
from app.models.questionnaire import Question, QuestionOption
from app.schemas.questionnaire import QuestionResponse, QuestionnaireSeed

router = APIRouter(prefix="/questionnaire", tags=["Опросник"])


@router.get("/", response_model=list[QuestionResponse])
async def get_questionnaire(db: AsyncSession = Depends(get_db)) -> list[QuestionResponse]:
    """
    Возвращает все активные вопросы опросника с вариантами ответов.
    Фронт вызывает этот endpoint при загрузке страницы опросника.
    """
    result = await db.execute(
        select(Question)
        .where(Question.is_active == True)
        .options(selectinload(Question.options))  # загружаем варианты одним запросом
        .order_by(Question.order)
    )
    questions = result.scalars().all()

    if not questions:
        raise HTTPException(
            status_code=404,
            detail="Опросник ещё не заполнен. Администратор должен загрузить вопросы через /questionnaire/seed.",
        )

    return [QuestionResponse.model_validate(q) for q in questions]


@router.post("/seed", response_model=dict, status_code=201)
async def seed_questionnaire(
    payload: QuestionnaireSeed,
    db: AsyncSession = Depends(get_db),
#    admin: User = Depends(get_current_admin)
) -> dict:
    """
    Заполняет опросник вопросами из JSON.
    Полностью заменяет существующие вопросы — идемпотентная операция.

    Вызывается вручную при первом запуске или при обновлении опросника.

    Пример тела запроса:
    {
      "questions": [
        {
          "text": "Что тебе ближе в работе?",
          "type": "single",
          "order": 1,
          "options": [
            { "text": "Анализировать данные", "trait": "аналитическое мышление", "order": 1 },
            { "text": "Создавать интерфейсы",  "trait": "визуальное мышление", "order": 2 }
          ]
        },
        {
          "text": "Как жить то?",
          "type": "single",
          "order": 1,
          "options": [
            { "text": "Спать", "trait": "умни", "order": 1 },
            { "text": "Жрать",  "trait": "тупи", "order": 2 }
          ]
        },
        {
          "text": "Опиши себя в двух-трёх предложениях",
          "type": "free_text",
          "order": 2,
          "options": []
        }
      ]
    }
    """
    # Удаляем старые вопросы — cascade удалит и варианты
    await db.execute(delete(Question))

    # Создаём новые
    for q_data in payload.questions:
        question = Question(
            text=q_data.text,
            type=q_data.type,
            order=q_data.order,
            is_active=q_data.is_active,
        )
        db.add(question)
        await db.flush()  # получаем question.id до создания вариантов

        for opt_data in q_data.options:
            option = QuestionOption(
                question_id=question.id,
                text=opt_data.text,
                trait=opt_data.trait,
                order=opt_data.order,
            )
            db.add(option)

    await db.commit()

    return {
        "message": f"Опросник успешно загружен.",
        "questions_created": len(payload.questions),
    }


@router.patch("/{question_id}/deactivate", response_model=dict)
async def deactivate_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> dict:
    """
    Отключает вопрос без удаления — он перестанет отображаться на фронте.
    Удобно если нужно временно убрать вопрос не трогая seed.
    """
    result = await db.execute(
        select(Question).where(Question.id == question_id)
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail=f"Вопрос {question_id} не найден.")

    question.is_active = False
    await db.commit()

    return {"message": f"Вопрос {question_id} отключён."}