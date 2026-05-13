from __future__ import annotations

from typing import Optional, List, Tuple
from uuid import UUID

from sqlalchemy import select, delete, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseDocument
from app.models.document import Document
from app.schemas.course import CourseCreate, CourseUpdate


class CourseCRUD:
    def __init__(self):
        pass

    async def get_course_by_id(self, db: AsyncSession, course_id: UUID) -> Optional[Course]:
        result = await db.execute(select(Course).where(Course.id == course_id))
        return result.scalar_one_or_none()

    async def get_course_by_owner_and_name(self, db: AsyncSession, owner_id: UUID, name: str) -> Optional[Course]:
        result = await db.execute(
            select(Course).where(Course.owner_id == owner_id, Course.name == name)
        )
        return result.scalar_one_or_none()

    async def get_courses_by_owner(
        self,
        db: AsyncSession,
        owner_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Course]:
        result = await db.execute(
            select(Course)
            .where(Course.owner_id == owner_id)
            .order_by(Course.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_course(self, db: AsyncSession, data: CourseCreate) -> Course:
        course = Course(**data.model_dump(exclude_unset=True))
        db.add(course)
        await db.flush()
        await db.refresh(course)
        return course

    async def update_course(self, db: AsyncSession, course_id: UUID, data: CourseUpdate) -> Optional[Course]:
        values = data.model_dump(exclude_unset=True)
        if not values:
            return await self.get_course_by_id(db, course_id)

        await db.execute(update(Course).where(Course.id == course_id).values(**values))
        return await self.get_course_by_id(db, course_id)

    async def delete_course(self, db: AsyncSession, course_id: UUID) -> bool:
        result = await db.execute(delete(Course).where(Course.id == course_id))
        return result.rowcount > 0

    async def get_course_document_link(
        self,
        db: AsyncSession,
        course_id: UUID,
        document_id: UUID,
    ) -> Optional[CourseDocument]:
        result = await db.execute(
            select(CourseDocument).where(
                CourseDocument.course_id == course_id,
                CourseDocument.document_id == document_id,
            )
        )
        return result.scalar_one_or_none()

    async def add_document_to_course(
        self,
        db: AsyncSession,
        course_id: UUID,
        document_id: UUID,
    ) -> CourseDocument:
        link = CourseDocument(course_id=course_id, document_id=document_id)
        db.add(link)
        await db.flush()
        await db.refresh(link)
        return link

    async def remove_document_from_course(
        self,
        db: AsyncSession,
        course_id: UUID,
        document_id: UUID,
    ) -> bool:
        result = await db.execute(
            delete(CourseDocument).where(
                CourseDocument.course_id == course_id,
                CourseDocument.document_id == document_id,
            )
        )
        return result.rowcount > 0

    async def get_course_documents(
        self,
        db: AsyncSession,
        course_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> List[tuple[Document, object]]:
        result = await db.execute(
            select(Document, CourseDocument.created_at)
            .join(CourseDocument, CourseDocument.document_id == Document.id)
            .where(CourseDocument.course_id == course_id)
            .order_by(CourseDocument.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.all())

    async def count_course_documents(self, db: AsyncSession, course_id: UUID) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(CourseDocument)
            .where(CourseDocument.course_id == course_id)
        )
        return int(result.scalar_one() or 0)
