from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.document import DocumentStatus
from app.schemas.document_report import DocumentReportActivityItem
from app.schemas.document_vote import DocumentVoteActivityItem


class UserActivityDocumentItem(BaseModel):
    id: UUID
    title: str
    subject: str
    department: str
    status: DocumentStatus
    download_count: int
    like_count: int
    dislike_count: int
    report_count: int
    file_size: int
    created_at: datetime


class UserActivityCourseItem(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    created_at: datetime


class UserActivityResponse(BaseModel):
    user_id: UUID
    documents: list[UserActivityDocumentItem]
    votes: list[DocumentVoteActivityItem]
    reports: list[DocumentReportActivityItem]
    courses: list[UserActivityCourseItem]
