from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.document import DocumentResponse


class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None


class CourseCreate(CourseBase):
    owner_id: Optional[UUID] = None


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    owner_id: Optional[UUID] = None


class CourseResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CourseDocumentBase(BaseModel):
    course_id: UUID
    document_id: UUID


class CourseDocumentCreate(CourseDocumentBase):
    pass


class CourseDocumentResponse(BaseModel):
    id: UUID
    course_id: UUID
    document_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class CourseDocumentItemResponse(BaseModel):
    document: DocumentResponse
    added_at: datetime


class CourseDetailResponse(CourseResponse):
    documents: List[CourseDocumentItemResponse] = Field(default_factory=list)
