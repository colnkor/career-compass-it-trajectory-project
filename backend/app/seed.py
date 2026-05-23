from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash


async def seed_admin():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.full_name == "admin")
        )

        admin = result.scalar_one_or_none()

        if admin:
            print("Админ уже существует")
            return

        new_admin = User(
            full_name="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            is_admin=True,
        )

        db.add(new_admin)
        await db.commit()

        print("Админ создан")