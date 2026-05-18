from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel


DocumentReportReason = Literal["spam", "incorrect", "copyright", "inappropriate", "other"]
DocumentReportStatus = Literal["pending", "reviewed", "resolved", "dismissed"]


class DocumentReportCreateRequest(BaseModel):
    reason: DocumentReportReason
    description: Optional[str] = None


class DocumentReportAdminUpdateRequest(BaseModel):
    status: DocumentReportStatus
    admin_note: Optional[str] = None


class DocumentReportSummary(BaseModel):
    id: UUID
    reason: DocumentReportReason
    description: Optional[str] = None
    status: DocumentReportStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentReportResponse(DocumentReportSummary):
    document_id: UUID
    user_id: UUID
    admin_note: Optional[str] = None
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None


class DocumentReportAdminResponse(DocumentReportResponse):
    document_title: Optional[str] = None
    reporter_username: Optional[str] = None
    reviewer_username: Optional[str] = None


class DocumentReportActivityItem(BaseModel):
    id: UUID
    document_id: UUID
    document_title: Optional[str] = None
    reason: DocumentReportReason
    status: DocumentReportStatus
    created_at: datetime
    updated_at: datetime
