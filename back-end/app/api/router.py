from fastapi import APIRouter
from app.api.v1 import bookmark_api, course_api, document_api, document_download_api, document_report_api, user_api

api_router = APIRouter()
api_router.include_router(user_api.router)
api_router.include_router(document_api.router)
api_router.include_router(document_report_api.router)
api_router.include_router(course_api.router)
api_router.include_router(bookmark_api.router)
api_router.include_router(document_download_api.router)
