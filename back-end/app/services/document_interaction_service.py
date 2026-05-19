from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.bookmark import BookmarkCRUD
from app.crud.document import DocumentCRUD
from app.crud.document_report import DocumentReportCRUD
from app.crud.document_vote import DocumentVoteCRUD
from app.schemas.document_report import (
    DocumentReportAdminResponse,
    DocumentReportCreateRequest,
    DocumentReportResponse,
    DocumentReportSummary,
)
from app.schemas.document import DocumentResponse
from app.schemas.document_vote import (
    DocumentInteractionResponse,
    DocumentVoteDetailResponse,
    DocumentVoteResponse,
    DocumentVoteType,
)
from app.services.storage_service import StorageService


class DocumentInteractionService:
    def __init__(self) -> None:
        self.document_crud = DocumentCRUD()
        self.bookmark_crud = BookmarkCRUD()
        self.vote_crud = DocumentVoteCRUD()
        self.report_crud = DocumentReportCRUD()
        self.storage_service = StorageService()

    async def _get_approved_document(self, db: AsyncSession, document_id: UUID):
        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")
        if document.status != "approved":
            raise HTTPException(status_code=403, detail="Document is not approved yet")
        return document

    def _build_document_response(self, document) -> DocumentResponse:
        payload = DocumentResponse.model_validate(document)
        assigned_url = self.storage_service.generate_view_url(document.file_key, is_public=False)
        return payload.model_copy(update={"assigned_url": assigned_url})

    @staticmethod
    def _build_interaction_response(document, *, is_bookmarked: bool = False, current_vote=None, current_report=None) -> DocumentInteractionResponse:
        report_summary = None
        if current_report is not None:
            report_summary = DocumentReportSummary.model_validate(current_report)

        return DocumentInteractionResponse(
            document_id=document.id,
            like_count=document.like_count,
            dislike_count=document.dislike_count,
            report_count=document.report_count,
            is_bookmarked=is_bookmarked,
            current_vote=getattr(current_vote, "vote_type", None),
            current_report=report_summary,
        )

    @staticmethod
    def _build_admin_report_response(report, document_title=None, reporter_username=None):
        payload = DocumentReportAdminResponse.model_validate(report)
        return payload.model_copy(
            update={
                "document_title": document_title,
                "reporter_username": reporter_username,
            }
        )

    async def _refresh_document_summary(self, db: AsyncSession, document_id: UUID):
        like_count, dislike_count = await self.vote_crud.count_document_votes(db, document_id)
        report_count = await self.report_crud.count_reports_by_document(db, document_id)
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
        bookmark = await self.bookmark_crud.get_bookmark(db, user_id, document_id)
        return self._build_interaction_response(
            document,
            is_bookmarked=bookmark is not None,
            current_vote=current_vote,
            current_report=current_report,
        )

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
        bookmark = await self.bookmark_crud.get_bookmark(db, user_id, document_id)
        return self._build_interaction_response(
            document,
            is_bookmarked=bookmark is not None,
            current_report=current_report,
        )

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
            )
        else:
            report = await self.report_crud.update_report(
                db,
                current_report.id,
                reason=payload.reason,
            )

        await self._refresh_document_summary(db, document_id)
        return DocumentReportResponse.model_validate(report)

    async def list_reports(
        self,
        db: AsyncSession,
        *,
        document_id: UUID | None = None,
        user_id: UUID | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[DocumentReportAdminResponse]:
        rows = await self.report_crud.list_reports(
            db,
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
            )
            for report, document_title, reporter_username in rows
        ]

    async def get_report_detail(self, db: AsyncSession, report_id: UUID) -> DocumentReportAdminResponse:
        row = await self.report_crud.get_report_detail_row(db, report_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Report not found")

        report, document_title, reporter_username = row
        return self._build_admin_report_response(
            report,
            document_title=document_title,
            reporter_username=reporter_username,
        )

    async def list_user_votes(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        vote_type: DocumentVoteType | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[DocumentVoteDetailResponse]:
        rows = await self.vote_crud.get_user_voted_documents(
            db,
            user_id=user_id,
            vote_type=vote_type,
            search=search,
            skip=skip,
            limit=limit,
        )
        return [
            DocumentVoteDetailResponse(
                document=self._build_document_response(document),
                vote_type=vote.vote_type,
                voted_at=vote.created_at,
                updated_at=vote.updated_at,
            )
            for vote, document in rows
        ]

    async def count_user_votes(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        vote_type: DocumentVoteType | None = None,
        search: str | None = None,
    ) -> int:
        return await self.vote_crud.count_user_votes(
            db,
            user_id=user_id,
            vote_type=vote_type,
            search=search,
        )
