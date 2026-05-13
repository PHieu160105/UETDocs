from __future__ import annotations

from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document_rating import DocumentRating


class DocumentRatingCRUD:
    def __init__(self):
        pass

    async def get_rating_by_id(self, db: AsyncSession, rating_id: UUID) -> Optional[DocumentRating]:
        result = await db.execute(select(DocumentRating).where(DocumentRating.id == rating_id))
        return result.scalar_one_or_none()

    async def get_rating_by_user_and_document(
        self,
        db: AsyncSession,
        user_id: UUID,
        document_id: UUID,
    ) -> Optional[DocumentRating]:
        result = await db.execute(
            select(DocumentRating).where(
                DocumentRating.user_id == user_id,
                DocumentRating.document_id == document_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_ratings_by_user_with_document_title(
        self,
        db: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[tuple[DocumentRating, Optional[str]]]:
        from app.models.document import Document

        result = await db.execute(
            select(DocumentRating, Document.title.label("document_title"))
            .join(Document, Document.id == DocumentRating.document_id, isouter=True)
            .where(DocumentRating.user_id == user_id)
            .order_by(DocumentRating.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.all())

    async def get_ratings_by_document(
        self,
        db: AsyncSession,
        document_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[DocumentRating]:
        result = await db.execute(
            select(DocumentRating)
            .where(DocumentRating.document_id == document_id)
            .order_by(DocumentRating.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create_rating(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        document_id: UUID,
        score: Decimal,
    ) -> DocumentRating:
        rating = DocumentRating(user_id=user_id, document_id=document_id, score=score)
        db.add(rating)
        await db.flush()
        await db.refresh(rating)
        return rating

    async def update_rating(
        self,
        db: AsyncSession,
        rating_id: UUID,
        *,
        score: Decimal,
    ) -> Optional[DocumentRating]:
        await db.execute(
            update(DocumentRating)
            .where(DocumentRating.id == rating_id)
            .values(score=score)
        )
        return await self.get_rating_by_id(db, rating_id)

    async def delete_rating(self, db: AsyncSession, rating_id: UUID) -> bool:
        result = await db.execute(delete(DocumentRating).where(DocumentRating.id == rating_id))
        return result.rowcount > 0

    async def count_document_ratings(self, db: AsyncSession, document_id: UUID) -> int:
        result = await db.execute(
            select(func.count()).select_from(DocumentRating).where(DocumentRating.document_id == document_id)
        )
        return int(result.scalar_one() or 0)

    async def get_document_rating_average(self, db: AsyncSession, document_id: UUID) -> Decimal:
        result = await db.execute(
            select(func.avg(DocumentRating.score)).where(DocumentRating.document_id == document_id)
        )
        average = result.scalar_one_or_none()
        if average is None:
            return Decimal("0.0")
        return Decimal(str(average))
