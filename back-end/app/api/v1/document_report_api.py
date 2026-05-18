from typing import List
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.authorization import require_admin
from app.core.database import get_db
from app.schemas.document_report import (
    DocumentReportAdminResponse,
    DocumentReportAdminUpdateRequest,
    DocumentReportStatus,
)
from app.services.document_interaction_service import DocumentInteractionService


router = APIRouter()
document_interaction_service = DocumentInteractionService()


@router.get("/document-reports/admin", response_model=List[DocumentReportAdminResponse], dependencies=[Depends(require_admin)])
async def list_document_reports(
    db: AsyncSession = Depends(get_db),
    status: DocumentReportStatus | None = Query(None),
    document_id: UUID | None = Query(None),
    user_id: UUID | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    return await document_interaction_service.list_reports(
        db,
        status=status,
        document_id=document_id,
        user_id=user_id,
        skip=skip,
        limit=limit,
    )


@router.get("/document-reports/admin/{report_id}", response_model=DocumentReportAdminResponse, dependencies=[Depends(require_admin)])
async def get_document_report_detail(report_id: UUID, db: AsyncSession = Depends(get_db)):
    return await document_interaction_service.get_report_detail(db, report_id)


@router.patch("/document-reports/admin/{report_id}", response_model=DocumentReportAdminResponse, dependencies=[Depends(require_admin)])
async def update_document_report(
    report_id: UUID,
    payload: DocumentReportAdminUpdateRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(require_admin),
):
    report = await document_interaction_service.update_report_admin(
        db,
        report_id=report_id,
        payload=payload,
        admin_user_id=getattr(admin_user, "id", None),
    )
    await db.commit()
    return report
