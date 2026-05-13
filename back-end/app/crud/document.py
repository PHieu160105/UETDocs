from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Optional, List

from sqlalchemy import select, update, delete, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentStatus,
)


class DocumentCRUD:
    def __init__(self):
        pass

    async def get_document_by_id(self, db: AsyncSession, document_id: UUID) -> Optional[Document]:
        result = await db.execute(select(Document).where(Document.id == document_id))
        return result.scalar_one_or_none()

    async def get_document_by_file_key(self, db: AsyncSession, file_key: str) -> Optional[Document]:
        result = await db.execute(select(Document).where(Document.file_key == file_key))
        return result.scalar_one_or_none()

    async def get_documents(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        status: Optional[DocumentStatus] = None,
        uploader_id: Optional[UUID] = None,
        department: Optional[str] = None,
        subject: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Document]:
        query = select(Document)

        if status is not None:
            query = query.where(Document.status == status)
        if uploader_id is not None:
            query = query.where(Document.uploader_id == uploader_id)
        if department is not None:
            query = query.where(Document.department == department)
        if subject is not None:
            query = query.where(Document.subject == subject)
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

        query = query.order_by(Document.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create_document(self, db: AsyncSession, data: DocumentCreate) -> Document:
        payload = data.model_dump(exclude_unset=True)
        document = Document(**payload)
        db.add(document)
        await db.flush()
        await db.refresh(document)
        return document

    async def update_document(
        self,
        db: AsyncSession,
        document_id: UUID,
        data: DocumentUpdate,
    ) -> Optional[Document]:
        values = data.model_dump(exclude_unset=True)
        if not values:
            return await self.get_document_by_id(db, document_id)

        await db.execute(update(Document).where(Document.id == document_id).values(**values))
        return await self.get_document_by_id(db, document_id)

    async def delete_document(self, db: AsyncSession, document_id: UUID) -> bool:
        result = await db.execute(delete(Document).where(Document.id == document_id))
        return result.rowcount > 0

    async def increment_download_count(
        self,
        db: AsyncSession,
        document_id: UUID,
        amount: int = 1,
    ) -> Optional[Document]:
        await db.execute(
            update(Document)
            .where(Document.id == document_id)
            .values(download_count=Document.download_count + amount)
        )
        return await self.get_document_by_id(db, document_id)

    async def update_rating_summary(
        self,
        db: AsyncSession,
        document_id: UUID,
        rating_count: int,
        rating_average: float,
    ) -> Optional[Document]:
        await db.execute(
            update(Document)
            .where(Document.id == document_id)
            .values(
                rating_count=rating_count,
                rating_average=rating_average,
            )
        )
        return await self.get_document_by_id(db, document_id)

    async def set_document_status(
        self,
        db: AsyncSession,
        document_id: UUID,
        status: DocumentStatus,
        approved_by: Optional[UUID] = None,
        approved_at: Optional[datetime] = None,
    ) -> Optional[Document]:
        values = {"status": status}
        if approved_by is not None:
            values["approved_by"] = approved_by
        if approved_at is not None:
            values["approved_at"] = approved_at

        await db.execute(update(Document).where(Document.id == document_id).values(**values))
        return await self.get_document_by_id(db, document_id)
