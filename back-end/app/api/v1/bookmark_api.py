from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.authorization import get_current_user
from app.core.database import get_db
from app.schemas.bookmark import BookmarkDetailResponse, BookmarkResponse
from app.services.bookmark_service import BookmarkService


router = APIRouter()
bookmark_service = BookmarkService()


@router.post("/bookmarks/{document_id}", response_model=BookmarkResponse)
async def create_bookmark(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    bookmark = await bookmark_service.create_bookmark(
        db,
        user_id=getattr(current_user, "id", None),
        document_id=document_id,
    )
    await db.commit()
    return bookmark


@router.get("/bookmarks", response_model=List[BookmarkDetailResponse])
async def list_my_bookmarks(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    return await bookmark_service.list_my_bookmarks(
        db,
        user_id=getattr(current_user, "id", None),
        skip=skip,
        limit=limit,
    )


@router.delete("/bookmarks/{document_id}")
async def delete_bookmark(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    deleted = await bookmark_service.delete_bookmark(
        db,
        user_id=getattr(current_user, "id", None),
        document_id=document_id,
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found")
    await db.commit()
    return {"detail": "Bookmark deleted"}
