from uuid import UUID
from typing import List, Literal

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, Query, Response, UploadFile, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.authorization import get_current_user, require_admin
from app.core.database import get_db
from app.schemas.document import (
    DocumentRegister,
    DocumentRejectRequest,
    DocumentResponse,
    DocumentStatus,
    DocumentUpdate,
    DocumentUploadUrlRequest,
)
from app.schemas.document_report import DocumentReportCreateRequest, DocumentReportResponse
from app.schemas.document_vote import (
    DocumentInteractionResponse,
    DocumentVoteDetailResponse,
    DocumentVoteResponse,
    DocumentVoteUpsertRequest,
)
from app.schemas.course import CourseMembershipResponse
from app.services.course_service import CourseService
from app.services.document_interaction_service import DocumentInteractionService
from app.services.document_service import DocumentService


router = APIRouter()
document_service = DocumentService()
document_interaction_service = DocumentInteractionService()
course_service = CourseService()


@router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(
    response: Response,
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    uploader_id: UUID | None = Query(None),
    department: str | None = Query(None),
    subject: str | None = Query(None),
    search: str | None = Query(None),
    sort: Literal["newest", "downloads", "likes", "rating"] = Query("newest"),
):
    total = await document_service.count_documents(
        db,
        status="approved",
        uploader_id=uploader_id,
        department=department,
        subject=subject,
        search=search,
    )
    response.headers["X-Total-Count"] = str(total)

    return await document_service.list_documents(
        db,
        skip=skip,
        limit=limit,
        status="approved",
        uploader_id=uploader_id,
        department=department,
        subject=subject,
        search=search,
        sort=sort,
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


@router.post("/documents/upload-file")
async def upload_file_to_storage(
    file: UploadFile = File(...),
    folder: str = Form("documents"),
    _current_user = Depends(get_current_user),
):
    upload_result = await document_service.upload_document_file(
        upload_file=file,
        folder=folder,
    )
    return upload_result


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


@router.get("/documents/me/uploads", response_model=List[DocumentResponse])
async def get_my_uploaded_documents(
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: DocumentStatus | None = Query(None),
    search: str | None = Query(None),
):
    user_id = getattr(current_user, "id", None)
    total = await document_service.count_documents(
        db,
        uploader_id=user_id,
        status=status,
        search=search,
    )
    response.headers["X-Total-Count"] = str(total)

    return await document_service.list_documents(
        db,
        skip=skip,
        limit=limit,
        uploader_id=user_id,
        status=status,
        search=search,
    )


@router.get("/document-votes/me", response_model=List[DocumentVoteDetailResponse])
async def get_my_document_votes(
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    vote: Literal["like", "dislike"] | None = Query(None),
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    user_id = getattr(current_user, "id", None)
    total = await document_interaction_service.count_user_votes(
        db,
        user_id=user_id,
        vote_type=vote,
        search=search,
    )
    response.headers["X-Total-Count"] = str(total)
    return await document_interaction_service.list_user_votes(
        db,
        user_id=user_id,
        vote_type=vote,
        search=search,
        skip=skip,
        limit=limit,
    )


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


@router.get("/documents/{document_id}/text-preview", response_class=PlainTextResponse)
async def get_document_text_preview(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    content = await document_service.get_text_preview(db, document_id)
    return PlainTextResponse(content, media_type="text/plain; charset=utf-8")


@router.get("/documents/{document_id}/interaction", response_model=DocumentInteractionResponse)
async def get_document_interaction(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return await document_interaction_service.get_interaction(
        db,
        document_id=document_id,
        user_id=getattr(current_user, "id", None),
    )


@router.put("/documents/{document_id}/vote", response_model=DocumentVoteResponse)
async def upsert_document_vote(
    document_id: UUID,
    payload: DocumentVoteUpsertRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vote = await document_interaction_service.upsert_vote(
        db,
        document_id=document_id,
        user_id=getattr(current_user, "id", None),
        vote_type=payload.vote,
    )
    await db.commit()
    return vote


@router.delete("/documents/{document_id}/vote", response_model=DocumentInteractionResponse)
async def delete_document_vote(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    interaction = await document_interaction_service.delete_vote(
        db,
        document_id=document_id,
        user_id=getattr(current_user, "id", None),
    )
    await db.commit()
    return interaction


@router.post("/documents/{document_id}/report", response_model=DocumentReportResponse)
async def create_document_report(
    document_id: UUID,
    payload: DocumentReportCreateRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    report = await document_interaction_service.create_or_update_report(
        db,
        document_id=document_id,
        user_id=getattr(current_user, "id", None),
        payload=payload,
    )
    await db.commit()
    return report


@router.get("/documents/{document_id}/courses/me", response_model=List[CourseMembershipResponse])
async def list_my_courses_for_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return await course_service.list_course_memberships_for_document(
        db,
        owner_id=getattr(current_user, "id", None),
        document_id=document_id,
    )


@router.post("/documents/{document_id}/reject", response_model=DocumentResponse, dependencies=[Depends(require_admin)])
async def reject_document(
    document_id: UUID,
    payload: DocumentRejectRequest = Body(...),
    db: AsyncSession = Depends(get_db),
):
    rejected_document = await document_service.reject_document(
        db,
        document_id,
        payload,
    )
    if rejected_document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    await db.commit()
    return rejected_document


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
