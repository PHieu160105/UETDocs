import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, Text, UniqueConstraint, func
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

    description = Column(Text, nullable=True)

    status = Column(
        Enum("pending", "reviewed", "resolved", "dismissed", name="document_report_status_enum"),
        nullable=False,
        default="pending",
        server_default="pending",
    )

    admin_note = Column(Text, nullable=True)

    reviewed_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    reviewed_at = Column(DateTime(timezone=True), nullable=True)

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
        Index("ix_document_reports_status", "status"),
    )

    document = relationship("Document", back_populates="reports", lazy="select")
    user = relationship(
        "User",
        back_populates="document_reports",
        lazy="select",
        foreign_keys=[user_id],
    )
    reviewer = relationship(
        "User",
        back_populates="reviewed_document_reports",
        lazy="select",
        foreign_keys=[reviewed_by],
    )

    def __repr__(self) -> str:
        return (
            f"<DocumentReport(doc={self.document_id}, user={self.user_id}, "
            f"reason={self.reason}, status={self.status})>"
        )
