from fastapi import APIRouter
from app.api.v1 import user_api

api_router = APIRouter()
api_router.include_router(user_api.router)
