from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.llm_cache import LLMCache

CACHE_TTL_DAYS = 7


async def get_cached(
    db: AsyncSession,
    user_id: int,
    topic_id: int,
    allow_stale: bool = False,
) -> tuple[LLMCache | None, bool]:
    """
    Возвращает (cache_entry, is_stale).
    allow_stale=True — отдаёт даже истёкший кэш (для fallback при ошибке LLM).
    """
    result = await db.execute(
        select(LLMCache).where(
            LLMCache.user_id == user_id,
            LLMCache.topic_id == topic_id,
        )
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        return None, False

    now = datetime.now(timezone.utc)
    is_stale = entry.expires_at.replace(tzinfo=timezone.utc) < now

    if is_stale and not allow_stale:
        return None, False

    return entry, is_stale


async def set_cached(
    db: AsyncSession,
    user_id: int,
    topic_id: int,
    profession_id: int,
    source: str,
    response_text: str,
) -> LLMCache:
    # Upsert: удаляем старые записи по ключу
    await db.execute(
        delete(LLMCache).where(
            LLMCache.user_id == user_id,
            LLMCache.topic_id == topic_id,
        )
    )

    expires_at = datetime.now(timezone.utc) + timedelta(days=CACHE_TTL_DAYS)
    entry = LLMCache(
        user_id=user_id,
        topic_id=topic_id,
        profession_id=profession_id,
        source=source,
        response_text=response_text,
        expires_at=expires_at,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry