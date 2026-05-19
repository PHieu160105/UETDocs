from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.document import DocumentResponse
from app.schemas.document_report import DocumentReportSummary


DocumentVoteType = Literal["like", "dislike"]


class DocumentVoteUpsertRequest(BaseModel):
    vote: DocumentVoteType


class DocumentVoteResponse(BaseModel):
    id: UUID
    document_id: UUID
    user_id: UUID
    vote_type: DocumentVoteType
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentVoteActivityItem(BaseModel):
    id: UUID
    document_id: UUID
    document_title: Optional[str] = None
    vote_type: DocumentVoteType
    created_at: datetime
    updated_at: datetime


class DocumentVoteDetailResponse(BaseModel):
    document: DocumentResponse
    vote_type: DocumentVoteType
    voted_at: datetime
    updated_at: datetime


class DocumentInteractionResponse(BaseModel):
    document_id: UUID
    like_count: int
    dislike_count: int
    report_count: int
    is_bookmarked: bool = False
    current_vote: Optional[DocumentVoteType] = None
    current_report: Optional[DocumentReportSummary] = None
