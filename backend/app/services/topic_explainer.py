import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.models.roadmap import RoadmapTopic, RoadmapPhase
from app.models.progress import UserProgress
from app.models.profession import Profession
from app.models.user import User
from app.services import llm_service

logger = logging.getLogger(__name__)

async def _validate_topic_and_profession(
    db: AsyncSession, topic_id: int, profession_id: int
) -> tuple[RoadmapTopic, RoadmapPhase, Profession]:
    """Проверяет существование и принадлежность topic → phase → profession."""
    result = await db.execute(
        select(RoadmapTopic)
        .join(RoadmapPhase, RoadmapTopic.phase_id == RoadmapPhase.id)
        .join(Profession, RoadmapPhase.profession_id == Profession.id)
        .options(
            selectinload(RoadmapTopic.phase).selectinload(RoadmapPhase.profession)
        )
        .where(
            RoadmapTopic.id == topic_id,
            RoadmapPhase.profession_id == profession_id,
        )
    )
    topic = result.scalar_one_or_none()
    if topic is None:
        raise ValueError("Тема не найдена или не принадлежит указанной профессии")

    return topic, topic.phase, topic.phase.profession


async def build_user_progress_summary(
    db: AsyncSession, user_id: int, profession_id: int
) -> str:
    """Формирует текстовое резюме прогресса пользователя по профессии."""
    result = await db.execute(
        select(UserProgress)
        .join(RoadmapTopic, UserProgress.topic_id == RoadmapTopic.id)
        .join(RoadmapPhase, RoadmapTopic.phase_id == RoadmapPhase.id)
        .options(selectinload(UserProgress.topic))
        .where(
            UserProgress.user_id == user_id,
            UserProgress.profession_id == profession_id,
        )
    )
    progress_rows = result.scalars().all()

    if not progress_rows:
        return "Пользователь ещё не начал изучение — прогресс пуст."

    completed = [p.topic.title for p in progress_rows if p.is_completed]
    in_progress = [p.topic.title for p in progress_rows if not p.is_completed]

    parts = []
    if completed:
        parts.append(f"Уже изучено ({len(completed)}): " + ", ".join(completed))
    if in_progress:
        parts.append(f"В процессе ({len(in_progress)}): " + ", ".join(in_progress))
    return ". ".join(parts)


def _build_user_prompt(
    user: User,
    profession: Profession,
    phase: RoadmapPhase,
    topic: RoadmapTopic,
    progress_summary: str,
    source: str,
) -> str:
    return (
        f"Профессия: {profession.name}\n"
        f"Фаза: {phase.title}\n"
        f"Тема для объяснения: {topic.title}\n"
        f"Описание темы из дорожной карты: {topic.description or 'не указано'}\n\n"
        f"Имя ученика: {user.full_name}\n"
        f"Прогресс ученика: {progress_summary}\n\n"
        f"Контекст вызова: {source}\n\n"
        f"Пожалуйста, подробно объясни эту тему, адаптировав объяснение под текущий уровень ученика."
    )


async def explain_topic(
    db: AsyncSession,
    user: User,
    topic_id: int,
    profession_id: int,
    source: str,
) -> str:
    """Собирает контекст и запрашивает объяснение у LLM."""
    topic, phase, profession = await _validate_topic_and_profession(
        db, topic_id, profession_id
    )
    progress_summary = await build_user_progress_summary(db, user.id, profession_id)
    user_prompt = _build_user_prompt(user, profession, phase, topic, progress_summary, source)

    if llm_service.llm_service is None:
        raise RuntimeError("LLM-сервис не инициализирован")

    return await llm_service.llm_service.get_answer(query=user_prompt)
