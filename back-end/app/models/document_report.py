import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models import Base


class DocumentReport(Base):
    __tablename__ = "document_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    reason = Column(
        Enum(
            "spam",
            "incorrect",
            "copyright",
            "inappropriate",
            "other",
            name="document_report_reason_enum",
        ),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("document_id", "user_id", name="uq_document_reports_document_user"),
        Index("ix_document_reports_document_id", "document_id"),
        Index("ix_document_reports_user_id", "user_id"),
    )

    document = relationship("Document", back_populates="reports", lazy="select")
    user = relationship(
        "User",
        back_populates="document_reports",
        lazy="select",
        foreign_keys=[user_id],
    )

    def __repr__(self) -> str:
        return f"<DocumentReport(doc={self.document_id}, user={self.user_id}, reason={self.reason})>"
