from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.document import DocumentStatus


class UserActivityDocumentItem(BaseModel):
    id: UUID
    title: str
    subject: str
    department: str
    status: DocumentStatus
    download_count: int
    rating_average: Decimal
    rating_count: int
    file_size: int
    created_at: datetime


class UserActivityRatingItem(BaseModel):
    id: UUID
    document_id: UUID
    document_title: Optional[str] = None
    score: Decimal
    created_at: datetime


class UserActivityCourseItem(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    created_at: datetime


class UserActivityResponse(BaseModel):
    user_id: UUID
    documents: list[UserActivityDocumentItem]
    ratings: list[UserActivityRatingItem]
    courses: list[UserActivityCourseItem]
