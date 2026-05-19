from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.authorization import require_admin
from app.core.database import get_db
from app.schemas.document_report import (
    DocumentReportAdminResponse,
)
from app.services.document_interaction_service import DocumentInteractionService


router = APIRouter()
document_interaction_service = DocumentInteractionService()


@router.get("/document-reports/admin", response_model=List[DocumentReportAdminResponse], dependencies=[Depends(require_admin)])
async def list_document_reports(
    db: AsyncSession = Depends(get_db),
    document_id: UUID | None = Query(None),
    user_id: UUID | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    return await document_interaction_service.list_reports(
        db,
        document_id=document_id,
        user_id=user_id,
        skip=skip,
        limit=limit,
    )


@router.get("/document-reports/admin/{report_id}", response_model=DocumentReportAdminResponse, dependencies=[Depends(require_admin)])
async def get_document_report_detail(report_id: UUID, db: AsyncSession = Depends(get_db)):
    return await document_interaction_service.get_report_detail(db, report_id)
