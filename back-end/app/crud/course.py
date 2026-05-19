from __future__ import annotations

from typing import Optional, List, Tuple
from uuid import UUID

from sqlalchemy import select, delete, update, func, or_, case
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
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[tuple[Course, int]]:
        query = (
            select(
                Course,
                func.count(CourseDocument.document_id).label("document_count"),
            )
            .outerjoin(CourseDocument, CourseDocument.course_id == Course.id)
            .where(Course.owner_id == owner_id)
            .group_by(Course.id)
        )
        if search:
            pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Course.name.ilike(pattern),
                    Course.description.ilike(pattern),
                )
            )

        result = await db.execute(
            query.order_by(Course.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.all())

    async def count_courses_by_owner(
        self,
        db: AsyncSession,
        owner_id: UUID,
        search: str | None = None,
    ) -> int:
        query = select(func.count()).select_from(Course).where(Course.owner_id == owner_id)
        if search:
            pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Course.name.ilike(pattern),
                    Course.description.ilike(pattern),
                )
            )
        result = await db.execute(query)
        return int(result.scalar_one() or 0)

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

    async def list_course_memberships_for_document(
        self,
        db: AsyncSession,
        *,
        owner_id: UUID,
        document_id: UUID,
    ) -> List[tuple[Course, int, bool]]:
        contains_document = func.max(
            case((CourseDocument.document_id == document_id, 1), else_=0)
        ).label("contains_document")
        document_count = func.count(CourseDocument.document_id).label("document_count")

        result = await db.execute(
            select(Course, document_count, contains_document)
            .outerjoin(CourseDocument, CourseDocument.course_id == Course.id)
            .where(Course.owner_id == owner_id)
            .group_by(Course.id)
            .order_by(Course.created_at.desc())
        )
        return [
            (course, int(count or 0), bool(contains))
            for course, count, contains in result.all()
        ]

    async def get_recent_course_document_links_by_owner(
        self,
        db: AsyncSession,
        *,
        owner_id: UUID,
        limit: int = 10,
    ) -> List[Tuple[CourseDocument, Course, Optional[Document]]]:
        result = await db.execute(
            select(CourseDocument, Course, Document)
            .join(Course, Course.id == CourseDocument.course_id)
            .join(Document, Document.id == CourseDocument.document_id, isouter=True)
            .where(Course.owner_id == owner_id)
            .order_by(CourseDocument.created_at.desc())
            .limit(limit)
        )
        return list(result.all())
