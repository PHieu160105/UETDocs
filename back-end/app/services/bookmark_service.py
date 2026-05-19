from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.bookmark import BookmarkCRUD
from app.crud.document import DocumentCRUD
from app.schemas.bookmark import BookmarkDetailResponse, BookmarkResponse
from app.schemas.document import DocumentResponse
from app.services.storage_service import StorageService


class BookmarkService:
    def __init__(self) -> None:
        self.bookmark_crud = BookmarkCRUD()
        self.document_crud = DocumentCRUD()
        self.storage_service = StorageService()

    def _build_document_response(self, document) -> DocumentResponse:
        detail = DocumentResponse.model_validate(document)
        assigned_url = self.storage_service.generate_view_url(document.file_key, is_public=False)
        return detail.model_copy(update={"assigned_url": assigned_url})

    async def create_bookmark(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        document_id: UUID,
    ) -> BookmarkResponse:
        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")

        existing = await self.bookmark_crud.get_bookmark(db, user_id, document_id)
        if existing is not None:
            raise HTTPException(status_code=409, detail="Document already bookmarked")

        bookmark = await self.bookmark_crud.create_bookmark(db, user_id, document_id)
        return BookmarkResponse.model_validate(bookmark)

    async def delete_bookmark(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        document_id: UUID,
    ) -> bool:
        return await self.bookmark_crud.delete_bookmark(db, user_id, document_id)

    async def list_my_bookmarks(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[BookmarkDetailResponse]:
        bookmarks = await self.bookmark_crud.get_user_bookmarks(
            db,
            user_id,
            search=search,
            skip=skip,
            limit=limit,
        )
        return [
            BookmarkDetailResponse(
                document=self._build_document_response(document),
                bookmarked_at=bookmarked_at,
            )
            for document, bookmarked_at in bookmarks
        ]

    async def count_my_bookmarks(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        search: str | None = None,
    ) -> int:
        return await self.bookmark_crud.count_user_bookmarks(db, user_id, search=search)
