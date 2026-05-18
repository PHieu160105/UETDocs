from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.document import DocumentCRUD
from app.crud.document_download import DocumentDownloadCRUD
from app.schemas.document import DocumentCreate, DocumentResponse, DocumentUpdate, DocumentStatus
from app.services.storage_service import StorageService


class DocumentService:
    MAX_TEXT_PREVIEW_BYTES = 512 * 1024

    def __init__(self) -> None:
        self.document_crud = DocumentCRUD()
        self.download_crud = DocumentDownloadCRUD()
        self.storage_service = StorageService()

    @staticmethod
    def _is_text_previewable(document) -> bool:
        mime_type = (document.mime_type or "").lower()
        if mime_type.startswith("text/"):
            return True

        extension = Path(document.original_name or "").suffix.lower()
        return extension in {
            ".txt",
            ".md",
            ".csv",
            ".json",
            ".log",
            ".xml",
            ".yml",
            ".yaml",
        }

    def _build_document_response(self, document, *, is_public: bool = False) -> DocumentResponse:
        detail = DocumentResponse.model_validate(document)
        assigned_url = self.storage_service.generate_view_url(
            document.file_key,
            is_public=is_public,
        )
        return detail.model_copy(update={"assigned_url": assigned_url})

    async def prepare_upload(
        self,
        *,
        original_filename: str,
        folder: str = "documents",
        expired_minutes: int = 10,
    ) -> dict:
        if not original_filename:
            raise HTTPException(status_code=400, detail="original_filename is required")

        # Keep uploads private until moderation approves the document.
        visibility = "private"

        upload_data = self.storage_service.generate_upload_url(
            original_filename=original_filename,
            folder=folder,
            visibility=visibility,
            expired_minutes=expired_minutes,
        )

        return {
            "upload_url": upload_data["upload_url"],
            "object_key": upload_data["object_key"],
            "visibility": upload_data["visibility"],
        }

    async def register_uploaded_document(
        self,
        db: AsyncSession,
        *,
        title: str,
        file_key: str,
        original_name: str,
        file_size: int,
        department: str,
        subject: str,
        description: Optional[str] = None,
        mime_type: Optional[str] = None,
        year: Optional[int] = None,
        teacher: Optional[str] = None,
        note: Optional[str] = None,
        uploader_id: Optional[UUID] = None,
    ) -> DocumentResponse:
        if not file_key:
            raise HTTPException(status_code=400, detail="file_key is required")

        if not self.storage_service.file_exists(file_key):
            raise HTTPException(status_code=400, detail="Uploaded file does not exist in storage")

        document = await self.document_crud.create_document(
            db,
            DocumentCreate(
                title=title,
                description=description,
                file_key=file_key,
                original_name=original_name,
                file_size=file_size,
                mime_type=mime_type,
                department=department,
                subject=subject,
                year=year,
                teacher=teacher,
                note=note,
                uploader_id=uploader_id,
            ),
        )

        return self._build_document_response(document, is_public=False)

    async def upload_document_file(
        self,
        *,
        upload_file: UploadFile,
        folder: str = "documents",
    ) -> dict:
        if upload_file.file is None:
            raise HTTPException(status_code=400, detail="Uploaded file is missing")

        original_filename = upload_file.filename or ""
        if not original_filename:
            raise HTTPException(status_code=400, detail="Filename required")

        stream = upload_file.file
        current_position = stream.tell()
        stream.seek(0, 2)
        file_size = stream.tell()
        stream.seek(current_position or 0)

        if current_position != 0:
            stream.seek(0)

        return self.storage_service.upload_file(
            stream,
            original_filename=original_filename,
            content_type=upload_file.content_type,
            file_size=file_size,
            folder=folder,
            visibility="private",
        )

    async def get_document_detail(
        self,
        db: AsyncSession,
        document_id: UUID,
    ) -> Optional[DocumentResponse]:
        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None:
            return None

        if document.status != "approved":
            return None

        return self._build_document_response(document, is_public=False)

    async def get_document_detail_admin(
        self,
        db: AsyncSession,
        document_id: UUID,
    ) -> Optional[DocumentResponse]:
        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None:
            return None

        return DocumentResponse.model_validate(document)

    async def list_documents(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 20,
        status: DocumentStatus | None = None,
        uploader_id: UUID | None = None,
        department: str | None = None,
        subject: str | None = None,
        search: str | None = None,
        sort: str = "newest",
    ) -> list[DocumentResponse]:
        documents = await self.document_crud.get_documents(
            db,
            skip=skip,
            limit=limit,
            status=status,
            uploader_id=uploader_id,
            department=department,
            subject=subject,
            search=search,
            sort=sort,
        )
        return [DocumentResponse.model_validate(document) for document in documents]

    async def count_documents(
        self,
        db: AsyncSession,
        *,
        status: DocumentStatus | None = None,
        uploader_id: UUID | None = None,
        department: str | None = None,
        subject: str | None = None,
        search: str | None = None,
    ) -> int:
        return await self.document_crud.count_documents(
            db,
            status=status,
            uploader_id=uploader_id,
            department=department,
            subject=subject,
            search=search,
        )

    async def update_document(
        self,
        db: AsyncSession,
        document_id: UUID,
        data: DocumentUpdate,
    ) -> Optional[DocumentResponse]:
        document = await self.document_crud.update_document(db, document_id, data)
        if document is None:
            return None
        return DocumentResponse.model_validate(document)

    async def delete_document(
        self,
        db: AsyncSession,
        document_id: UUID,
    ) -> bool:
        return await self.document_crud.delete_document(db, document_id)

    async def generate_access_url(
        self,
        db: AsyncSession,
        document_id: UUID,
        *,
        expired_minutes: int = 10,
        public_base_url: str | None = None,
    ) -> str:
        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")

        if document.status != "approved":
            raise HTTPException(status_code=403, detail="Document is not approved yet")

        return self.storage_service.generate_view_url(
            document.file_key,
            is_public=False,
            expired_minutes=expired_minutes,
            public_base_url=public_base_url,
        )

    async def generate_admin_access_url(
        self,
        db: AsyncSession,
        document_id: UUID,
        *,
        expired_minutes: int = 10,
    ) -> str:
        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")

        return self.storage_service.generate_view_url(
            document.file_key,
            is_public=False,
            expired_minutes=expired_minutes,
        )

    async def increment_download_count(
        self,
        db: AsyncSession,
        document_id: UUID,
        amount: int = 1,
        user_id: UUID | None = None,
    ) -> Optional[DocumentResponse]:
        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None:
            return None

        if document.status != "approved":
            raise HTTPException(status_code=403, detail="Document is not approved yet")

        if user_id is not None:
            await self.download_crud.create_download_log(db, user_id=user_id, document_id=document_id)

        updated_document = await self.document_crud.increment_download_count(db, document_id, amount=amount)
        if updated_document is None:
            return None
        return DocumentResponse.model_validate(updated_document)

    async def download_document(
        self,
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ) -> Optional[dict]:
        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None:
            return None

        if document.status != "approved":
            raise HTTPException(status_code=403, detail="Document is not approved yet")

        await self.download_crud.create_download_log(db, user_id=user_id, document_id=document_id)
        updated_document = await self.document_crud.increment_download_count(db, document_id, amount=1)
        if updated_document is None:
            return None
        return {
            "download_url": self.storage_service.generate_download_url(
                updated_document.file_key,
                original_filename=updated_document.original_name,
                is_public=False,
            ),
            "filename": updated_document.original_name,
        }

    async def get_text_preview(
        self,
        db: AsyncSession,
        document_id: UUID,
    ) -> str:
        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")

        if document.status != "approved":
            raise HTTPException(status_code=403, detail="Document is not approved yet")

        if not self._is_text_previewable(document):
            raise HTTPException(status_code=415, detail="Document type does not support text preview")

        if (document.file_size or 0) > self.MAX_TEXT_PREVIEW_BYTES:
            raise HTTPException(
                status_code=413,
                detail=(
                    "Text preview is limited to files up to "
                    f"{self.MAX_TEXT_PREVIEW_BYTES // 1024} KB"
                ),
            )

        return self.storage_service.get_text_content(document.file_key)

    async def approve_document(
        self,
        db: AsyncSession,
        document_id: UUID,
        approved_by: Optional[UUID] = None,
        approved_at: Optional[datetime] = None,
    ) -> Optional[DocumentResponse]:
        document = await self.document_crud.set_document_status(
            db,
            document_id,
            status="approved",
            approved_by=approved_by,
            approved_at=approved_at or datetime.now(timezone.utc),
        )
        if document is None:
            return None
        return DocumentResponse.model_validate(document)
