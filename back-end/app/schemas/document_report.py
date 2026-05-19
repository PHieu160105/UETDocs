from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel


DocumentReportReason = Literal["spam", "incorrect", "copyright", "inappropriate", "other"]


class DocumentReportCreateRequest(BaseModel):
    reason: DocumentReportReason


class DocumentReportSummary(BaseModel):
    id: UUID
    reason: DocumentReportReason
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentReportResponse(DocumentReportSummary):
    document_id: UUID
    user_id: UUID


class DocumentReportAdminResponse(DocumentReportResponse):
    document_title: Optional[str] = None
    reporter_username: Optional[str] = None


class DocumentReportActivityItem(BaseModel):
    id: UUID
    document_id: UUID
    document_title: Optional[str] = None
    reason: DocumentReportReason
    created_at: datetime
    updated_at: datetime
