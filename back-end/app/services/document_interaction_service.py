from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.document import DocumentCRUD
from app.crud.document_report import DocumentReportCRUD
from app.crud.document_vote import DocumentVoteCRUD
from app.schemas.document_report import (
    DocumentReportAdminResponse,
    DocumentReportAdminUpdateRequest,
    DocumentReportCreateRequest,
    DocumentReportStatus,
    DocumentReportResponse,
    DocumentReportSummary,
)
from app.schemas.document_vote import DocumentInteractionResponse, DocumentVoteResponse, DocumentVoteType


class DocumentInteractionService:
    def __init__(self) -> None:
        self.document_crud = DocumentCRUD()
        self.vote_crud = DocumentVoteCRUD()
        self.report_crud = DocumentReportCRUD()

    async def _get_approved_document(self, db: AsyncSession, document_id: UUID):
        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")
        if document.status != "approved":
            raise HTTPException(status_code=403, detail="Document is not approved yet")
        return document

    @staticmethod
    def _build_interaction_response(document, current_vote=None, current_report=None) -> DocumentInteractionResponse:
        report_summary = None
        if current_report is not None:
            report_summary = DocumentReportSummary.model_validate(current_report)

        return DocumentInteractionResponse(
            document_id=document.id,
            like_count=document.like_count,
            dislike_count=document.dislike_count,
            report_count=document.report_count,
            current_vote=getattr(current_vote, "vote_type", None),
            current_report=report_summary,
        )

    @staticmethod
    def _build_admin_report_response(report, document_title=None, reporter_username=None, reviewer_username=None):
        payload = DocumentReportAdminResponse.model_validate(report)
        return payload.model_copy(
            update={
                "document_title": document_title,
                "reporter_username": reporter_username,
                "reviewer_username": reviewer_username,
            }
        )

    async def _refresh_document_summary(self, db: AsyncSession, document_id: UUID):
        like_count, dislike_count = await self.vote_crud.count_document_votes(db, document_id)
        report_count = await self.report_crud.count_open_reports_by_document(db, document_id)
        return await self.document_crud.update_interaction_summary(
            db,
            document_id,
            like_count=like_count,
            dislike_count=dislike_count,
            report_count=report_count,
        )

    async def get_interaction(
        self,
        db: AsyncSession,
        *,
        document_id: UUID,
        user_id: UUID,
    ) -> DocumentInteractionResponse:
        document = await self._get_approved_document(db, document_id)
        current_vote = await self.vote_crud.get_vote_by_user_and_document(db, user_id, document_id)
        current_report = await self.report_crud.get_report_by_user_and_document(db, user_id, document_id)
        return self._build_interaction_response(document, current_vote=current_vote, current_report=current_report)

    async def upsert_vote(
        self,
        db: AsyncSession,
        *,
        document_id: UUID,
        user_id: UUID,
        vote_type: DocumentVoteType,
    ) -> DocumentVoteResponse:
        await self._get_approved_document(db, document_id)
        current_vote = await self.vote_crud.get_vote_by_user_and_document(db, user_id, document_id)

        if current_vote is None:
            current_vote = await self.vote_crud.create_vote(
                db,
                user_id=user_id,
                document_id=document_id,
                vote_type=vote_type,
            )
        elif current_vote.vote_type != vote_type:
            current_vote = await self.vote_crud.update_vote(
                db,
                current_vote.id,
                vote_type=vote_type,
            )

        await self._refresh_document_summary(db, document_id)
        return DocumentVoteResponse.model_validate(current_vote)

    async def delete_vote(
        self,
        db: AsyncSession,
        *,
        document_id: UUID,
        user_id: UUID,
    ) -> DocumentInteractionResponse:
        await self._get_approved_document(db, document_id)
        await self.vote_crud.delete_vote_by_user_and_document(
            db,
            user_id=user_id,
            document_id=document_id,
        )
        document = await self._refresh_document_summary(db, document_id)
        current_report = await self.report_crud.get_report_by_user_and_document(db, user_id, document_id)
        return self._build_interaction_response(document, current_report=current_report)

    async def create_or_update_report(
        self,
        db: AsyncSession,
        *,
        document_id: UUID,
        user_id: UUID,
        payload: DocumentReportCreateRequest,
    ) -> DocumentReportResponse:
        await self._get_approved_document(db, document_id)
        current_report = await self.report_crud.get_report_by_user_and_document(db, user_id, document_id)

        if current_report is None:
            report = await self.report_crud.create_report(
                db,
                user_id=user_id,
                document_id=document_id,
                reason=payload.reason,
                description=payload.description,
            )
        else:
            report = await self.report_crud.update_report(
                db,
                current_report.id,
                reason=payload.reason,
                description=payload.description,
                status="pending",
                admin_note=None,
                reviewed_by=None,
                reviewed_at=None,
            )

        await self._refresh_document_summary(db, document_id)
        return DocumentReportResponse.model_validate(report)

    async def list_reports(
        self,
        db: AsyncSession,
        *,
        status: DocumentReportStatus | None = None,
        document_id: UUID | None = None,
        user_id: UUID | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[DocumentReportAdminResponse]:
        rows = await self.report_crud.list_reports(
            db,
            status=status,
            document_id=document_id,
            user_id=user_id,
            skip=skip,
            limit=limit,
        )
        return [
            self._build_admin_report_response(
                report,
                document_title=document_title,
                reporter_username=reporter_username,
                reviewer_username=reviewer_username,
            )
            for report, document_title, reporter_username, reviewer_username in rows
        ]

    async def get_report_detail(self, db: AsyncSession, report_id: UUID) -> DocumentReportAdminResponse:
        row = await self.report_crud.get_report_detail_row(db, report_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Report not found")

        report, document_title, reporter_username, reviewer_username = row
        return self._build_admin_report_response(
            report,
            document_title=document_title,
            reporter_username=reporter_username,
            reviewer_username=reviewer_username,
        )

    async def update_report_admin(
        self,
        db: AsyncSession,
        *,
        report_id: UUID,
        payload: DocumentReportAdminUpdateRequest,
        admin_user_id: UUID,
    ) -> DocumentReportAdminResponse:
        report = await self.report_crud.get_report_by_id(db, report_id)
        if report is None:
            raise HTTPException(status_code=404, detail="Report not found")

        reviewed_at: Optional[datetime]
        reviewed_by: Optional[UUID]
        if payload.status == "pending":
            reviewed_at = None
            reviewed_by = None
        else:
            reviewed_at = datetime.now(timezone.utc)
            reviewed_by = admin_user_id

        updated = await self.report_crud.update_report_admin_fields(
            db,
            report_id,
            status=payload.status,
            admin_note=payload.admin_note,
            reviewed_by=reviewed_by,
            reviewed_at=reviewed_at,
        )
        if updated is None:
            raise HTTPException(status_code=404, detail="Report not found")
        await self._refresh_document_summary(db, updated.document_id)
        return await self.get_report_detail(db, report_id)
