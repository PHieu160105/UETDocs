from uuid import UUID
from typing import List

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.authorization import get_current_user, require_admin
from app.core.database import get_db
from app.schemas.document import (
    DocumentRegister,
    DocumentResponse,
    DocumentStatus,
    DocumentUpdate,
    DocumentUploadUrlRequest,
)
from app.services.document_service import DocumentService


router = APIRouter()
document_service = DocumentService()


@router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    uploader_id: UUID | None = Query(None),
    department: str | None = Query(None),
    subject: str | None = Query(None),
    search: str | None = Query(None),
):
    return await document_service.list_documents(
        db,
        skip=skip,
        limit=limit,
        status="approved",
        uploader_id=uploader_id,
        department=department,
        subject=subject,
        search=search,
    )


@router.get("/documents/admin", response_model=List[DocumentResponse], dependencies=[Depends(require_admin)])
async def get_documents_admin(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: DocumentStatus | None = Query(None),
    uploader_id: UUID | None = Query(None),
    department: str | None = Query(None),
    subject: str | None = Query(None),
    search: str | None = Query(None),
):
    return await document_service.list_documents(
        db,
        skip=skip,
        limit=limit,
        status=status,
        uploader_id=uploader_id,
        department=department,
        subject=subject,
        search=search,
    )


@router.get("/documents/admin/{document_id}", response_model=DocumentResponse, dependencies=[Depends(require_admin)])
async def get_document_admin(document_id: UUID, db: AsyncSession = Depends(get_db)):
    document = await document_service.get_document_detail_admin(db, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document with id {document_id} not found")
    return document


@router.get("/documents/admin/{document_id}/access-url", dependencies=[Depends(require_admin)])
async def get_document_admin_access_url(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    expired_minutes: int = Query(10, ge=1, le=1440),
):
    access_url = await document_service.generate_admin_access_url(
        db,
        document_id,
        expired_minutes=expired_minutes,
    )
    if not access_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return {"access_url": access_url}


@router.put("/documents/upload-url")
async def create_upload_url(
    payload: DocumentUploadUrlRequest = Body(...),
    _current_user = Depends(get_current_user),
):
    return await document_service.prepare_upload(
        original_filename=payload.original_filename,
        folder=payload.folder,
        expired_minutes=payload.expired_minutes,
    )


@router.put("/documents", response_model=DocumentResponse)
async def register_document(
    payload: DocumentRegister = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    document = await document_service.register_uploaded_document(
        db,
        title=payload.title,
        file_key=payload.file_key,
        original_name=payload.original_name,
        file_size=payload.file_size,
        department=payload.department,
        subject=payload.subject,
        description=payload.description,
        mime_type=payload.mime_type,
        year=payload.year,
        teacher=payload.teacher,
        note=payload.note,
        uploader_id=getattr(current_user, "id", None),
    )
    await db.commit()
    return document


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: UUID, db: AsyncSession = Depends(get_db)):
    document = await document_service.get_document_detail(db, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document with id {document_id} not found")
    return document


@router.get("/documents/{document_id}/access-url")
async def get_document_access_url(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
    expired_minutes: int = Query(10, ge=1, le=1440),
    public_base_url: str | None = Query(None),
):
    access_url = await document_service.generate_access_url(
        db,
        document_id,
        expired_minutes=expired_minutes,
        public_base_url=public_base_url,
    )
    if not access_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return {"access_url": access_url}


@router.patch("/documents/{document_id}", response_model=DocumentResponse, dependencies=[Depends(require_admin)])
async def update_document(
    document_id: UUID,
    payload: DocumentUpdate = Body(...),
    db: AsyncSession = Depends(get_db),
):
    document = await document_service.update_document(db, document_id, payload)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    await db.commit()
    return document


@router.post("/documents/{document_id}/approve", response_model=DocumentResponse, dependencies=[Depends(require_admin)])
async def approve_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(require_admin),
):
    approved_document = await document_service.approve_document(
        db,
        document_id,
        approved_by=getattr(admin_user, "id", None),
    )
    if approved_document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    await db.commit()
    return approved_document


@router.post("/documents/{document_id}/download")
async def increment_download_count(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    document = await document_service.download_document(
        db,
        document_id,
        getattr(current_user, "id", None),
    )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    await db.commit()
    return document


@router.delete("/documents/{document_id}", dependencies=[Depends(require_admin)])
async def delete_document(document_id: UUID, db: AsyncSession = Depends(get_db)):
    deleted = await document_service.delete_document(db, document_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    await db.commit()
    return {"detail": "Document deleted"}
