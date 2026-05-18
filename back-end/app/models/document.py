import uuid
from sqlalchemy import BigInteger, CheckConstraint, Column, Enum, ForeignKey, Integer, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    file_key = Column(String(500), nullable=False)          
    original_name = Column(String(255), nullable=False)     
    file_size = Column(BigInteger, nullable=False)          
    mime_type = Column(String(100), nullable=True) 

   
    status = Column(
        Enum("pending", "approved", "rejected", name="document_status_enum"),
        default="pending",
        nullable=False,
        index=True
    )

    uploader_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    approved_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    department = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    year = Column(Integer, nullable=True, index=True)
    teacher = Column(String(255), nullable=True)
    note = Column(Text, nullable=True)


    download_count = Column(Integer, default=0, nullable=False)
    like_count = Column(Integer, default=0, nullable=False)
    dislike_count = Column(Integer, default=0, nullable=False)
    report_count = Column(Integer, default=0, nullable=False)

    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    uploader = relationship(
        "User", 
        foreign_keys=[uploader_id], 
        back_populates="documents", 
        lazy="select"
    )

    approver = relationship(
        "User", 
        foreign_keys=[approved_by], 
        back_populates="approved_documents", 
        lazy="select"
    )

    votes = relationship(
        "DocumentVote",
        back_populates="document",
        lazy="select",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    reports = relationship(
        "DocumentReport",
        back_populates="document",
        lazy="select", 
        cascade="all, delete-orphan", 
        passive_deletes=True
    )

    course_links = relationship(
        "CourseDocument",
        back_populates="document",
        lazy="select",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    courses = relationship(
        "Course",
        secondary="course_documents",
        back_populates="documents",
        lazy="select",
        viewonly=True,
        overlaps="course_links,document_links"
    )

    bookmarks = relationship(
        "Bookmark",
        back_populates="document",
        lazy="select",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    download_logs = relationship(
        "DocumentDownload",
        back_populates="document",
        lazy="select",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    __table_args__ = (
        CheckConstraint("download_count >= 0", name="chk_download_count_positive"),
        CheckConstraint("like_count >= 0", name="chk_like_count_positive"),
        CheckConstraint("dislike_count >= 0", name="chk_dislike_count_positive"),
        CheckConstraint("report_count >= 0", name="chk_report_count_positive"),
    )

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, title='{self.title}', status='{self.status}')>"
