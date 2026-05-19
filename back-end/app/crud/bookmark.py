from __future__ import annotations

from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, delete, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bookmark import Bookmark
from app.models.document import Document


class BookmarkCRUD:
    def __init__(self):
        pass

    async def get_bookmark(
        self,
        db: AsyncSession,
        user_id: UUID,
        document_id: UUID,
    ) -> Optional[Bookmark]:
        result = await db.execute(
            select(Bookmark).where(
                Bookmark.user_id == user_id,
                Bookmark.document_id == document_id,
            )
        )
        return result.scalar_one_or_none()

    async def create_bookmark(self, db: AsyncSession, user_id: UUID, document_id: UUID) -> Bookmark:
        bookmark = Bookmark(user_id=user_id, document_id=document_id)
        db.add(bookmark)
        await db.flush()
        await db.refresh(bookmark)
        return bookmark

    async def delete_bookmark(self, db: AsyncSession, user_id: UUID, document_id: UUID) -> bool:
        result = await db.execute(
            delete(Bookmark).where(
                Bookmark.user_id == user_id,
                Bookmark.document_id == document_id,
            )
        )
        return result.rowcount > 0

    async def get_user_bookmarks(
        self,
        db: AsyncSession,
        user_id: UUID,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[tuple[Document, object]]:
        query = (
            select(Document, Bookmark.created_at)
            .join(Bookmark, Bookmark.document_id == Document.id)
            .where(Bookmark.user_id == user_id)
        )
        if search:
            pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Document.title.ilike(pattern),
                    Document.original_name.ilike(pattern),
                    Document.department.ilike(pattern),
                    Document.subject.ilike(pattern),
                )
            )

        result = await db.execute(
            query.order_by(Bookmark.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.all())

    async def count_user_bookmarks(
        self,
        db: AsyncSession,
        user_id: UUID,
        search: str | None = None,
    ) -> int:
        query = (
            select(func.count())
            .select_from(Bookmark)
            .join(Document, Bookmark.document_id == Document.id)
            .where(Bookmark.user_id == user_id)
        )
        if search:
            pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Document.title.ilike(pattern),
                    Document.original_name.ilike(pattern),
                    Document.department.ilike(pattern),
                    Document.subject.ilike(pattern),
                )
            )

        result = await db.execute(query)
        return int(result.scalar_one() or 0)
