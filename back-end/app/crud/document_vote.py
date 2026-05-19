from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import case, delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.document_vote import DocumentVote
from app.schemas.document_vote import DocumentVoteType


class DocumentVoteCRUD:
    async def get_vote_by_user_and_document(
        self,
        db: AsyncSession,
        user_id: UUID,
        document_id: UUID,
    ) -> Optional[DocumentVote]:
        result = await db.execute(
            select(DocumentVote).where(
                DocumentVote.user_id == user_id,
                DocumentVote.document_id == document_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_votes_by_user_with_document_title(
        self,
        db: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[tuple[DocumentVote, Optional[str]]]:
        from app.models.document import Document

        result = await db.execute(
            select(DocumentVote, Document.title.label("document_title"))
            .join(Document, Document.id == DocumentVote.document_id, isouter=True)
            .where(DocumentVote.user_id == user_id)
            .order_by(DocumentVote.updated_at.desc(), DocumentVote.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.all())

    async def get_user_voted_documents(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        vote_type: DocumentVoteType | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[tuple[DocumentVote, Document]]:
        query = (
            select(DocumentVote, Document)
            .join(Document, Document.id == DocumentVote.document_id)
            .where(DocumentVote.user_id == user_id)
        )
        if vote_type is not None:
            query = query.where(DocumentVote.vote_type == vote_type)
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
            query.order_by(DocumentVote.updated_at.desc(), DocumentVote.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.all())

    async def count_user_votes(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        vote_type: DocumentVoteType | None = None,
        search: str | None = None,
    ) -> int:
        query = (
            select(func.count())
            .select_from(DocumentVote)
            .join(Document, Document.id == DocumentVote.document_id)
            .where(DocumentVote.user_id == user_id)
        )
        if vote_type is not None:
            query = query.where(DocumentVote.vote_type == vote_type)
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

    async def create_vote(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        document_id: UUID,
        vote_type: DocumentVoteType,
    ) -> DocumentVote:
        vote = DocumentVote(user_id=user_id, document_id=document_id, vote_type=vote_type)
        db.add(vote)
        await db.flush()
        await db.refresh(vote)
        return vote

    async def update_vote(
        self,
        db: AsyncSession,
        vote_id: UUID,
        *,
        vote_type: DocumentVoteType,
    ) -> Optional[DocumentVote]:
        await db.execute(
            update(DocumentVote)
            .where(DocumentVote.id == vote_id)
            .values(vote_type=vote_type)
        )
        result = await db.execute(select(DocumentVote).where(DocumentVote.id == vote_id))
        return result.scalar_one_or_none()

    async def delete_vote_by_user_and_document(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        document_id: UUID,
    ) -> bool:
        result = await db.execute(
            delete(DocumentVote).where(
                DocumentVote.user_id == user_id,
                DocumentVote.document_id == document_id,
            )
        )
        return result.rowcount > 0

    async def count_document_votes(
        self,
        db: AsyncSession,
        document_id: UUID,
    ) -> tuple[int, int]:
        result = await db.execute(
            select(
                func.count(case((DocumentVote.vote_type == "like", 1))).label("like_count"),
                func.count(case((DocumentVote.vote_type == "dislike", 1))).label("dislike_count"),
            ).where(DocumentVote.document_id == document_id)
        )
        like_count, dislike_count = result.one()
        return int(like_count or 0), int(dislike_count or 0)
