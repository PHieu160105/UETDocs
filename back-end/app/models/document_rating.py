import uuid
from sqlalchemy import CheckConstraint, Column, ForeignKey, Index, Numeric, DateTime, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import Base

class DocumentRating(Base):
    __tablename__ = "document_ratings"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False
    )

    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    score = Column(
        Numeric(2, 1), 
        nullable=False,
        comment="Rating score from 0.5 to 5.0 (in 0.5 increments)"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint("document_id", "user_id", name="uq_doc_user_rating"),
        CheckConstraint("score >= 0.5 AND score <= 5.0 AND (score * 2) % 1 = 0", name="chk_score_valid"),
        Index("ix_ratings_document_id", "document_id"),
        Index("ix_ratings_user_id", "user_id"),
    )

    document = relationship(
        "Document", 
        back_populates="ratings", 
        lazy="select"
    )

    user = relationship(
        "User", 
        back_populates="ratings", 
        lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Rating(doc={self.document_id}, user={self.user_id}, score={self.score})>"