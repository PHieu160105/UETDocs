from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.document_download import DocumentDownloadCRUD
from app.crud.document import DocumentCRUD
from app.schemas.document_download import DocumentDownloadDetailResponse
from app.schemas.document import DocumentResponse
from app.services.storage_service import StorageService


class DocumentDownloadService:
    def __init__(self) -> None:
        self.download_crud = DocumentDownloadCRUD()
        self.document_crud = DocumentCRUD()
        self.storage_service = StorageService()

    def _build_document_response(self, document) -> DocumentResponse:
        detail = DocumentResponse.model_validate(document)
        assigned_url = self.storage_service.generate_view_url(document.file_key, is_public=False)
        return detail.model_copy(update={"assigned_url": assigned_url})

    async def record_download(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        document_id: UUID,
    ) -> DocumentResponse:
        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")

        await self.download_crud.create_download_log(db, user_id, document_id)
        updated = await self.document_crud.increment_download_count(db, document_id, amount=1)
        if updated is None:
            raise HTTPException(status_code=404, detail="Document not found")
        return self._build_document_response(updated)

    async def list_my_downloads(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[DocumentDownloadDetailResponse]:
        downloads = await self.download_crud.get_user_downloaded_documents(db, user_id, skip=skip, limit=limit)
        return [
            DocumentDownloadDetailResponse(
                document=self._build_document_response(document),
                last_downloaded_at=last_downloaded_at,
            )
            for document, last_downloaded_at in downloads
        ]
