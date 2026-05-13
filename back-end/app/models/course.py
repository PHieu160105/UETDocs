import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    owner = relationship("User", back_populates="courses", lazy="select")
    document_links = relationship(
        "CourseDocument",
        back_populates="course",
        lazy="select",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    documents = relationship(
        "Document",
        secondary="course_documents",
        back_populates="courses",
        lazy="select",
        viewonly=True,
        overlaps="document_links,course_links",
    )

    __table_args__ = (
        UniqueConstraint("owner_id", "name", name="uq_courses_owner_name"),
    )

    def __repr__(self) -> str:
        return f"<Course(id={self.id}, name='{self.name}', owner_id={self.owner_id})>"


class CourseDocument(Base):
    __tablename__ = "course_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course", back_populates="document_links", lazy="select")
    document = relationship("Document", back_populates="course_links", lazy="select")

    __table_args__ = (
        UniqueConstraint("course_id", "document_id", name="uq_course_document"),
    )

    def __repr__(self) -> str:
        return f"<CourseDocument(course_id={self.course_id}, document_id={self.document_id})>"
