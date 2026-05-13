import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import Base

class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False
    )

    username = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    email = Column(
        String(255),
        unique=True,     
        nullable=False,
        index=True
    )

    password = Column(
        String(255),      
        nullable=False
    )

    avatar_url = Column(
        String(500),
        nullable=True
    )

    role = Column(
        String(20),
        default="user",
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),  
        nullable=False
    )

    documents = relationship(
        "Document",
        foreign_keys="Document.uploader_id",
        back_populates="uploader",      
        lazy="select",                
        cascade="all, delete-orphan",   
        passive_deletes=True            
    )
    
    ratings = relationship(
        "DocumentRating",
        back_populates="user",          
        lazy="select",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    approved_documents = relationship(
        "Document",
        foreign_keys="[Document.approved_by]",
        back_populates="approver",
        lazy="select"
    )

    courses = relationship(
        "Course",
        back_populates="owner",
        lazy="select",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    bookmarks = relationship(
        "Bookmark",
        back_populates="user",
        lazy="select",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    document_downloads = relationship(
        "DocumentDownload",
        back_populates="user",
        lazy="select",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"
