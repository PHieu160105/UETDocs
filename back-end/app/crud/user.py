from uuid import UUID
from typing import Optional, List

from passlib.context import CryptContext
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

hash_helper = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCRUD:
    def __init__(self):
        pass

    async def get_user_by_id(self, db: AsyncSession, user_id: UUID) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()


    async def get_user_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()


    async def get_user_by_username(self, db: AsyncSession, username: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()


    async def get_all_users(self, db: AsyncSession, skip: int = 0, limit: int = 20) -> List[User]:
        result = await db.execute(select(User).offset(skip).limit(limit))
        return result.scalars().all()


    async def create_user(self, db: AsyncSession, role: str, data: UserCreate) -> User:
        hashed = hash_helper.hash(data.password)
        user = User(
            username=data.username,
            email=data.email,
            password=hashed,
            role=role,
        )
        db.add(user)
        await db.flush()   
        await db.refresh(user)
        return user


    async def update_user(self, db: AsyncSession, user_id: UUID, data: UserUpdate) -> Optional[User]:
        values = data.model_dump(exclude_unset=True)
        if not values:
            return await self.get_user_by_id(db, user_id)

        await db.execute(update(User).where(User.id == user_id).values(**values))
        return await self.get_user_by_id(db, user_id)


    async def delete_user(self, db: AsyncSession, user_id: UUID) -> bool:
        result = await db.execute(delete(User).where(User.id == user_id))
        return result.rowcount > 0
