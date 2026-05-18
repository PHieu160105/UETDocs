from uuid import UUID
from typing import List

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.authorization import get_current_user, require_admin
from app.auth.jwt_handler import encode_jwt
from app.core.database import get_db
from app.crud.course import CourseCRUD
from app.crud.document import DocumentCRUD
from app.crud.document_report import DocumentReportCRUD
from app.crud.document_vote import DocumentVoteCRUD
from app.crud.user import UserCRUD
from app.schemas.user import UserCreate, UserResponse, UserSignin, UserUpdate
from app.schemas.user_activity import UserActivityResponse

router = APIRouter()
hash_helper = CryptContext(schemes=["bcrypt"], deprecated="auto")
user_crud = UserCRUD()
document_crud = DocumentCRUD()
course_crud = CourseCRUD()
vote_crud = DocumentVoteCRUD()
report_crud = DocumentReportCRUD()


@router.post("/auth/login")
async def login(credentials: UserSignin = Body(...), db: AsyncSession = Depends(get_db)):
    if credentials.username:
        user = await user_crud.get_user_by_username(db, credentials.username)
    elif credentials.email:
        user = await user_crud.get_user_by_email(db, credentials.email)
    else:
        raise HTTPException(status_code=400, detail="Username or email is required")

    if not user or not hash_helper.verify(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid account or password")

    token = encode_jwt(data={"user_id": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.post("/auth/signup", response_model=UserResponse)
async def signup(user_data: UserCreate = Body(...), db: AsyncSession = Depends(get_db)):
    if await user_crud.get_user_by_username(db, user_data.username):
        raise HTTPException(status_code=409, detail="Username already exists")
    if await user_crud.get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    created_user = await user_crud.create_user(db, "user", data=user_data)
    await db.commit()
    return created_user


@router.post("/users/admin-account", response_model=UserResponse, dependencies=[Depends(require_admin)])
async def create_admin_account(user_data: UserCreate = Body(...), db: AsyncSession = Depends(get_db)):
    if await user_crud.get_user_by_username(db, user_data.username):
        raise HTTPException(status_code=409, detail="Username already exists")
    if await user_crud.get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    created_user = await user_crud.create_user(db, "admin", data=user_data)
    await db.commit()
    return created_user


@router.get("/users", response_model=List[UserResponse], dependencies=[Depends(require_admin)])
async def get_users(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    users = await user_crud.get_all_users(db, skip=skip, limit=limit)
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/users", response_model=UserResponse, dependencies=[Depends(require_admin)])
async def create_user(body: UserCreate, db: AsyncSession = Depends(get_db)):
    if await user_crud.get_user_by_email(db, body.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if await user_crud.get_user_by_username(db, body.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    created_user = await user_crud.create_user(db, "user", body)
    await db.commit()
    return created_user


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: UUID, body: UserUpdate, db: AsyncSession = Depends(get_db)):
    user = await user_crud.update_user(db, user_id, body)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await db.commit()
    return user


@router.delete("/users/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    deleted = await user_crud.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await db.commit()


@router.get("/users/{user_id}/activity", response_model=UserActivityResponse, dependencies=[Depends(require_admin)])
async def get_user_activity(user_id: UUID, db: AsyncSession = Depends(get_db)):
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    documents = await document_crud.get_documents(db, uploader_id=user_id, limit=100)
    vote_rows = await vote_crud.get_votes_by_user_with_document_title(db, user_id, limit=100)
    report_rows = await report_crud.get_reports_by_user_with_document_title(db, user_id, limit=100)
    courses = await course_crud.get_courses_by_owner(db, owner_id=user_id, limit=100)

    return UserActivityResponse(
        user_id=user_id,
        documents=[
            {
                "id": document.id,
                "title": document.title,
                "subject": document.subject,
                "department": document.department,
                "status": document.status,
                "download_count": document.download_count,
                "like_count": document.like_count,
                "dislike_count": document.dislike_count,
                "report_count": document.report_count,
                "file_size": document.file_size,
                "created_at": document.created_at,
            }
            for document in documents
        ],
        votes=[
            {
                "id": vote.id,
                "document_id": vote.document_id,
                "document_title": document_title or "(Khong ro)",
                "vote_type": vote.vote_type,
                "created_at": vote.created_at,
                "updated_at": vote.updated_at,
            }
            for vote, document_title in vote_rows
        ],
        reports=[
            {
                "id": report.id,
                "document_id": report.document_id,
                "document_title": document_title or "(Khong ro)",
                "reason": report.reason,
                "status": report.status,
                "created_at": report.created_at,
                "updated_at": report.updated_at,
            }
            for report, document_title in report_rows
        ],
        courses=[
            {
                "id": course.id,
                "name": course.name,
                "description": course.description,
                "created_at": course.created_at,
            }
            for course in courses
        ],
    )
