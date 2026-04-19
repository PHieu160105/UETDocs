from typing import Any, Dict
from uuid import UUID

from fastapi import Depends, HTTPException, status
from app.auth.jwt_bearer import JWTBearer

from app.core.database import get_db
from app.crud.user import UserCRUD
from sqlalchemy.ext.asyncio import AsyncSession

user_crud = UserCRUD()

async def get_current_user(
    token_payload: Dict[str, Any] = Depends(JWTBearer()),
    db: AsyncSession = Depends(get_db),
):
    user_id = token_payload.get("user_id")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        user_uuid = UUID(str(user_id))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = await user_crud.get_user_by_id(db, user_uuid)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

async def require_admin(current_user = Depends(get_current_user)):
    if getattr(current_user, "role", "") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    return current_user
