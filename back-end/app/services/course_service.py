from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.course import CourseCRUD
from app.crud.document import DocumentCRUD
from app.schemas.course import (
    CourseCreate,
    CourseDetailResponse,
    CourseDocumentItemResponse,
    CourseMembershipResponse,
    CourseResponse,
    CourseUpdate,
)
from app.schemas.document import DocumentResponse
from app.services.storage_service import StorageService


class CourseService:
    def __init__(self) -> None:
        self.course_crud = CourseCRUD()
        self.document_crud = DocumentCRUD()
        self.storage_service = StorageService()

    def _build_document_response(self, document) -> DocumentResponse:
        detail = DocumentResponse.model_validate(document)
        assigned_url = self.storage_service.generate_view_url(document.file_key, is_public=False)
        return detail.model_copy(update={"assigned_url": assigned_url})

    async def create_course(
        self,
        db: AsyncSession,
        *,
        owner_id: UUID,
        name: str,
        description: str | None = None,
    ) -> CourseResponse:
        if not name.strip():
            raise HTTPException(status_code=400, detail="Course name is required")

        existing = await self.course_crud.get_course_by_owner_and_name(db, owner_id, name.strip())
        if existing is not None:
            raise HTTPException(status_code=409, detail="Course name already exists for this user")

        course = await self.course_crud.create_course(
            db,
            CourseCreate(owner_id=owner_id, name=name.strip(), description=description),
        )
        return CourseResponse.model_validate(course)

    async def list_my_courses(
        self,
        db: AsyncSession,
        owner_id: UUID,
        *,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[CourseResponse]:
        courses = await self.course_crud.get_courses_by_owner(
            db,
            owner_id,
            search=search,
            skip=skip,
            limit=limit,
        )
        return [
            CourseResponse.model_validate(course).model_copy(update={"document_count": document_count})
            for course, document_count in courses
        ]

    async def count_my_courses(
        self,
        db: AsyncSession,
        owner_id: UUID,
        *,
        search: str | None = None,
    ) -> int:
        return await self.course_crud.count_courses_by_owner(db, owner_id, search=search)

    async def get_course_detail(
        self,
        db: AsyncSession,
        course_id: UUID,
        *,
        current_user_id: UUID,
        current_user_role: str = "user",
    ) -> Optional[CourseDetailResponse]:
        course = await self.course_crud.get_course_by_id(db, course_id)
        if course is None:
            return None

        if course.owner_id != current_user_id and current_user_role != "admin":
            raise HTTPException(status_code=403, detail="You do not have access to this course")

        documents = await self.course_crud.get_course_documents(db, course_id)
        items = [
            CourseDocumentItemResponse(
                document=self._build_document_response(document),
                added_at=added_at,
            )
            for document, added_at in documents
        ]
        document_count = await self.course_crud.count_course_documents(db, course_id)
        base_course = CourseResponse.model_validate(course)
        return CourseDetailResponse(
            **base_course.model_dump(exclude={"document_count"}),
            document_count=document_count,
            documents=items,
        )

    async def update_course(
        self,
        db: AsyncSession,
        course_id: UUID,
        *,
        current_user_id: UUID,
        current_user_role: str = "user",
        data: CourseUpdate,
    ) -> Optional[CourseResponse]:
        course = await self.course_crud.get_course_by_id(db, course_id)
        if course is None:
            return None
        if course.owner_id != current_user_id and current_user_role != "admin":
            raise HTTPException(status_code=403, detail="You do not have access to this course")

        if data.name is not None and not data.name.strip():
            raise HTTPException(status_code=400, detail="Course name is required")

        if data.name is not None:
            same_name = await self.course_crud.get_course_by_owner_and_name(db, course.owner_id, data.name.strip())
            if same_name is not None and same_name.id != course_id:
                raise HTTPException(status_code=409, detail="Course name already exists for this user")

        updated = await self.course_crud.update_course(
            db,
            course_id,
            CourseUpdate(
                name=data.name.strip() if data.name is not None else None,
                description=data.description,
            ),
        )
        if updated is None:
            return None
        return CourseResponse.model_validate(updated)

    async def delete_course(
        self,
        db: AsyncSession,
        course_id: UUID,
        *,
        current_user_id: UUID,
        current_user_role: str = "user",
    ) -> bool:
        course = await self.course_crud.get_course_by_id(db, course_id)
        if course is None:
            return False
        if course.owner_id != current_user_id and current_user_role != "admin":
            raise HTTPException(status_code=403, detail="You do not have access to this course")
        return await self.course_crud.delete_course(db, course_id)

    async def add_document(
        self,
        db: AsyncSession,
        course_id: UUID,
        document_id: UUID,
        *,
        current_user_id: UUID,
        current_user_role: str = "user",
    ):
        course = await self.course_crud.get_course_by_id(db, course_id)
        if course is None:
            raise HTTPException(status_code=404, detail="Course not found")
        if course.owner_id != current_user_id and current_user_role != "admin":
            raise HTTPException(status_code=403, detail="You do not have access to this course")

        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")

        if await self.course_crud.get_course_document_link(db, course_id, document_id):
            raise HTTPException(status_code=409, detail="Document already added to this course")

        return await self.course_crud.add_document_to_course(db, course_id, document_id)

    async def list_course_memberships_for_document(
        self,
        db: AsyncSession,
        *,
        owner_id: UUID,
        document_id: UUID,
    ) -> list[CourseMembershipResponse]:
        document = await self.document_crud.get_document_by_id(db, document_id)
        if document is None or document.status != "approved":
            raise HTTPException(status_code=404, detail="Document not found")

        memberships = await self.course_crud.list_course_memberships_for_document(
            db,
            owner_id=owner_id,
            document_id=document_id,
        )
        return [
            CourseMembershipResponse.model_validate(course).model_copy(
                update={
                    "document_count": document_count,
                    "contains_document": contains_document,
                }
            )
            for course, document_count, contains_document in memberships
        ]

    async def remove_document(
        self,
        db: AsyncSession,
        course_id: UUID,
        document_id: UUID,
        *,
        current_user_id: UUID,
        current_user_role: str = "user",
    ) -> bool:
        course = await self.course_crud.get_course_by_id(db, course_id)
        if course is None:
            return False
        if course.owner_id != current_user_id and current_user_role != "admin":
            raise HTTPException(status_code=403, detail="You do not have access to this course")

        return await self.course_crud.remove_document_from_course(db, course_id, document_id)
