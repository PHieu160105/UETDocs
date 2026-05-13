from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.document import DocumentResponse


class DocumentDownloadBase(BaseModel):
    user_id: Optional[UUID] = None
    document_id: UUID


class DocumentDownloadCreate(DocumentDownloadBase):
    pass


class DocumentDownloadResponse(BaseModel):
    id: UUID
    user_id: UUID
    document_id: UUID
    downloaded_at: datetime

    model_config = {"from_attributes": True}


class DocumentDownloadDetailResponse(BaseModel):
    document: DocumentResponse
    last_downloaded_at: datetime
