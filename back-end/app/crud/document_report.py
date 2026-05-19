from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document_report import DocumentReport
from app.models.document import Document
from app.models.user import User
from app.schemas.document_report import DocumentReportReason


class DocumentReportCRUD:
    async def get_report_by_id(self, db: AsyncSession, report_id: UUID) -> Optional[DocumentReport]:
        result = await db.execute(select(DocumentReport).where(DocumentReport.id == report_id))
        return result.scalar_one_or_none()

    async def get_report_by_user_and_document(
        self,
        db: AsyncSession,
        user_id: UUID,
        document_id: UUID,
    ) -> Optional[DocumentReport]:
        result = await db.execute(
            select(DocumentReport).where(
                DocumentReport.user_id == user_id,
                DocumentReport.document_id == document_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_reports_by_user_with_document_title(
        self,
        db: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[tuple[DocumentReport, Optional[str]]]:
        result = await db.execute(
            select(DocumentReport, Document.title.label("document_title"))
            .join(Document, Document.id == DocumentReport.document_id, isouter=True)
            .where(DocumentReport.user_id == user_id)
            .order_by(DocumentReport.updated_at.desc(), DocumentReport.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.all())

    async def create_report(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        document_id: UUID,
        reason: DocumentReportReason,
    ) -> DocumentReport:
        report = DocumentReport(
            user_id=user_id,
            document_id=document_id,
            reason=reason,
        )
        db.add(report)
        await db.flush()
        await db.refresh(report)
        return report

    async def update_report(
        self,
        db: AsyncSession,
        report_id: UUID,
        *,
        reason: DocumentReportReason,
    ) -> Optional[DocumentReport]:
        await db.execute(
            update(DocumentReport)
            .where(DocumentReport.id == report_id)
            .values(
                reason=reason,
            )
        )
        return await self.get_report_by_id(db, report_id)

    async def list_reports(
        self,
        db: AsyncSession,
        *,
        document_id: UUID | None = None,
        user_id: UUID | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[tuple[DocumentReport, Optional[str], Optional[str]]]:
        query = (
            select(
                DocumentReport,
                Document.title.label("document_title"),
                User.username.label("reporter_username"),
            )
            .join(Document, Document.id == DocumentReport.document_id, isouter=True)
            .join(User, User.id == DocumentReport.user_id, isouter=True)
        )

        if document_id is not None:
            query = query.where(DocumentReport.document_id == document_id)
        if user_id is not None:
            query = query.where(DocumentReport.user_id == user_id)

        query = query.order_by(DocumentReport.updated_at.desc(), DocumentReport.created_at.desc())
        result = await db.execute(query.offset(skip).limit(limit))
        return list(result.all())

    async def get_report_detail_row(
        self,
        db: AsyncSession,
        report_id: UUID,
    ) -> Optional[tuple[DocumentReport, Optional[str], Optional[str]]]:
        result = await db.execute(
            select(
                DocumentReport,
                Document.title.label("document_title"),
                User.username.label("reporter_username"),
            )
            .join(Document, Document.id == DocumentReport.document_id, isouter=True)
            .join(User, User.id == DocumentReport.user_id, isouter=True)
            .where(DocumentReport.id == report_id)
        )
        return result.one_or_none()

    async def count_reports_by_document(self, db: AsyncSession, document_id: UUID) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(DocumentReport)
            .where(DocumentReport.document_id == document_id)
        )
        return int(result.scalar_one() or 0)
