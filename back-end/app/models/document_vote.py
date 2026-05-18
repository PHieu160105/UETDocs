import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models import Base


class DocumentVote(Base):
    __tablename__ = "document_votes"

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

    vote_type = Column(
        Enum("like", "dislike", name="document_vote_type_enum"),
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
        UniqueConstraint("document_id", "user_id", name="uq_document_votes_document_user"),
        Index("ix_document_votes_document_id", "document_id"),
        Index("ix_document_votes_user_id", "user_id"),
        Index("ix_document_votes_document_vote_type", "document_id", "vote_type"),
    )

    document = relationship("Document", back_populates="votes", lazy="select")
    user = relationship("User", back_populates="document_votes", lazy="select")

    def __repr__(self) -> str:
        return f"<DocumentVote(doc={self.document_id}, user={self.user_id}, vote_type={self.vote_type})>"
