from __future__ import annotations

from typing import List
from uuid import UUID

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.document_download import DocumentDownload


class DocumentDownloadCRUD:
    def __init__(self):
        pass

    async def create_download_log(
        self,
        db: AsyncSession,
        user_id: UUID,
        document_id: UUID,
    ) -> DocumentDownload:
        log = DocumentDownload(user_id=user_id, document_id=document_id)
        db.add(log)
        await db.flush()
        await db.refresh(log)
        return log

    async def get_user_downloaded_documents(
        self,
        db: AsyncSession,
        user_id: UUID,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[tuple[Document, object]]:
        latest_downloads = (
            select(
                DocumentDownload.document_id.label("document_id"),
                func.max(DocumentDownload.downloaded_at).label("last_downloaded_at"),
            )
            .where(DocumentDownload.user_id == user_id)
            .group_by(DocumentDownload.document_id)
            .subquery()
        )

        query = (
            select(Document, latest_downloads.c.last_downloaded_at)
            .join(latest_downloads, latest_downloads.c.document_id == Document.id)
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
            query.order_by(latest_downloads.c.last_downloaded_at.desc()).offset(skip).limit(limit)
        )
        return list(result.all())

    async def count_user_downloaded_documents(
        self,
        db: AsyncSession,
        user_id: UUID,
        search: str | None = None,
    ) -> int:
        query = (
            select(func.count(func.distinct(DocumentDownload.document_id)))
            .select_from(DocumentDownload)
            .join(Document, DocumentDownload.document_id == Document.id)
            .where(DocumentDownload.user_id == user_id)
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

    async def count_download_events(self, db: AsyncSession, document_id: UUID) -> int:
        result = await db.execute(
            select(func.count()).select_from(DocumentDownload).where(DocumentDownload.document_id == document_id)
        )
        return int(result.scalar_one() or 0)
