from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class DocumentRatingBase(BaseModel):
    score: Decimal = Field(ge=Decimal("0.5"), le=Decimal("5.0"))

    @field_validator("score")
    @classmethod
    def validate_half_point_steps(cls, value: Decimal) -> Decimal:
        scaled = value * 2
        if scaled != scaled.to_integral_value():
            raise ValueError("score must be in 0.5 increments")
        return value


class DocumentRatingCreate(DocumentRatingBase):
    document_id: UUID


class DocumentRatingUpdate(DocumentRatingBase):
    pass


class DocumentRatingResponse(BaseModel):
    id: UUID
    document_id: UUID
    user_id: UUID
    score: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}
