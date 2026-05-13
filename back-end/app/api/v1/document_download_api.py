from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.authorization import get_current_user
from app.core.database import get_db
from app.schemas.document_download import DocumentDownloadDetailResponse
from app.services.document_download_service import DocumentDownloadService


router = APIRouter()
download_service = DocumentDownloadService()


@router.get("/downloads", response_model=List[DocumentDownloadDetailResponse])
async def list_my_downloads(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    return await download_service.list_my_downloads(
        db,
        user_id=getattr(current_user, "id", None),
        skip=skip,
        limit=limit,
    )
