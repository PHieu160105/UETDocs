from uuid import UUID
from typing import List

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.authorization import get_current_user
from app.core.database import get_db
from app.schemas.course import CourseCreate, CourseDetailResponse, CourseResponse, CourseUpdate
from app.services.course_service import CourseService


router = APIRouter()
course_service = CourseService()


@router.post("/courses", response_model=CourseResponse)
async def create_course(
    payload: CourseCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    course = await course_service.create_course(
        db,
        owner_id=getattr(current_user, "id", None),
        name=payload.name,
        description=payload.description,
    )
    await db.commit()
    return course


@router.get("/courses", response_model=List[CourseResponse])
async def list_my_courses(
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    total = await course_service.count_my_courses(
        db,
        getattr(current_user, "id", None),
        search=search,
    )
    response.headers["X-Total-Count"] = str(total)

    return await course_service.list_my_courses(
        db,
        getattr(current_user, "id", None),
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get("/courses/{course_id}", response_model=CourseDetailResponse)
async def get_course_detail(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    course = await course_service.get_course_detail(
        db,
        course_id,
        current_user_id=getattr(current_user, "id", None),
        current_user_role=getattr(current_user, "role", "user"),
    )
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.patch("/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    payload: CourseUpdate = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    course = await course_service.update_course(
        db,
        course_id,
        current_user_id=getattr(current_user, "id", None),
        current_user_role=getattr(current_user, "role", "user"),
        data=payload,
    )
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    await db.commit()
    return course


@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    deleted = await course_service.delete_course(
        db,
        course_id,
        current_user_id=getattr(current_user, "id", None),
        current_user_role=getattr(current_user, "role", "user"),
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    await db.commit()
    return {"detail": "Course deleted"}


@router.post("/courses/{course_id}/documents/{document_id}")
async def add_document_to_course(
    course_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    await course_service.add_document(
        db,
        course_id,
        document_id,
        current_user_id=getattr(current_user, "id", None),
        current_user_role=getattr(current_user, "role", "user"),
    )
    await db.commit()
    return {"detail": "Document added to course"}


@router.delete("/courses/{course_id}/documents/{document_id}")
async def remove_document_from_course(
    course_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    removed = await course_service.remove_document(
        db,
        course_id,
        document_id,
        current_user_id=getattr(current_user, "id", None),
        current_user_role=getattr(current_user, "role", "user"),
    )
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found in course")
    await db.commit()
    return {"detail": "Document removed from course"}
