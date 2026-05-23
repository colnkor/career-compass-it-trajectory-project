from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.questionnaire import Question, QuestionOption
from app.schemas.questionnaire import QuestionCreate, QuestionUpdate, QuestionResponse
from app.core.dependencies import get_current_admin

router = APIRouter(
    prefix="/admin/questions",
    tags=["Admin Questions CRUD"],
    dependencies=[Depends(get_current_admin)]
)


# 1. READ ALL
@router.get("/", response_model=list[QuestionResponse])
async def get_questions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Question)
        .options(selectinload(Question.options))
        .order_by(Question.order.asc())
    )
    return result.scalars().all()


# 2. CREATE
@router.post("/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(question_in: QuestionCreate, db: AsyncSession = Depends(get_db)):
    db_question = Question(
        text=question_in.text,
        type=question_in.type,
        order=question_in.order,
        is_active=question_in.is_active,
    )

    for opt in question_in.options:
        db_question.options.append(
            QuestionOption(text=opt.text, trait=opt.trait, order=opt.order)
        )

    db.add(db_question)
    await db.commit()
    await db.refresh(db_question)

    # refresh не подгружает связи — делаем отдельный запрос
    result = await db.execute(
        select(Question)
        .where(Question.id == db_question.id)
        .options(selectinload(Question.options))
    )
    return result.scalar_one()


# 3. UPDATE
@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    question_in: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Question)
        .where(Question.id == question_id)
        .options(selectinload(Question.options))
    )
    db_question = result.scalar_one_or_none()

    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")

    db_question.text = question_in.text
    db_question.type = question_in.type
    db_question.order = question_in.order
    db_question.is_active = question_in.is_active

    incoming_by_id = {opt.id: opt for opt in question_in.options if opt.id is not None}

    # Обновляем или удаляем существующие опции
    for db_opt in list(db_question.options):
        if db_opt.id in incoming_by_id:
            incoming = incoming_by_id[db_opt.id]
            db_opt.text = incoming.text
            db_opt.trait = incoming.trait
            db_opt.order = incoming.order
        else:
            db_question.options.remove(db_opt)

    # Добавляем новые опции (без id)
    for incoming in question_in.options:
        if incoming.id is None:
            db_question.options.append(
                QuestionOption(text=incoming.text, trait=incoming.trait, order=incoming.order)
            )

    await db.commit()

    result = await db.execute(
        select(Question)
        .where(Question.id == question_id)
        .options(selectinload(Question.options))
    )
    return result.scalar_one()


# 4. DELETE
@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(question_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.id == question_id))
    db_question = result.scalar_one_or_none()

    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")

    await db.delete(db_question)
    await db.commit()