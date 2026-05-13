from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional, Literal
from uuid import UUID

from pydantic import BaseModel

DocumentStatus = Literal["pending", "approved", "rejected"]


class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    file_key: str
    original_name: str
    file_size: int
    mime_type: Optional[str] = None
    department: str
    subject: str


class DocumentCreate(DocumentBase):
    uploader_id: Optional[UUID] = None
    status: DocumentStatus = "pending"
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    year: Optional[int] = None
    teacher: Optional[str] = None
    note: Optional[str] = None
    download_count: int = 0
    rating_count: int = 0
    rating_average: Decimal = Decimal("0.0")


class DocumentRegister(BaseModel):
    title: str
    description: Optional[str] = None
    file_key: str
    original_name: str
    file_size: int
    mime_type: Optional[str] = None
    department: str
    subject: str
    year: Optional[int] = None
    teacher: Optional[str] = None
    note: Optional[str] = None


class DocumentUploadUrlRequest(BaseModel):
    original_filename: str
    folder: str = "documents"
    expired_minutes: int = 10


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    file_key: Optional[str] = None
    original_name: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    status: Optional[DocumentStatus] = None
    uploader_id: Optional[UUID] = None
    approved_by: Optional[UUID] = None
    department: Optional[str] = None
    subject: Optional[str] = None
    year: Optional[int] = None
    teacher: Optional[str] = None
    note: Optional[str] = None
    download_count: Optional[int] = None
    rating_count: Optional[int] = None
    rating_average: Optional[Decimal] = None
    approved_at: Optional[datetime] = None


class DocumentResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    file_key: str
    assigned_url: Optional[str] = None
    original_name: str
    file_size: int
    mime_type: Optional[str]
    status: DocumentStatus
    uploader_id: Optional[UUID]
    approved_by: Optional[UUID]
    department: str
    subject: str
    download_count: int
    rating_count: int
    rating_average: Decimal
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


    model_config = {"from_attributes": True}
