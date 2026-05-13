from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.document import DocumentResponse


class BookmarkBase(BaseModel):
    user_id: Optional[UUID] = None
    document_id: UUID


class BookmarkCreate(BookmarkBase):
    pass


class BookmarkResponse(BaseModel):
    id: UUID
    user_id: UUID
    document_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class BookmarkDetailResponse(BaseModel):
    document: DocumentResponse
    bookmarked_at: datetime
