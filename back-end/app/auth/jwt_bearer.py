from typing import Any, Dict, Optional

from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from minio import credentials

from app.auth.jwt_handler import decode_jwt


# def verify_jwt(jwtoken: str) -> bool:
#     isTokenValid: bool = False

#     payload = decode_jwt(jwtoken)
#     if payload:
#         isTokenValid = True
#     return isTokenValid


class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> Optional[Dict[str, Any]]:
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)

        if not credentials:
            raise HTTPException(status_code=403, detail="Missing authentication token")
        
        if credentials.scheme != "Bearer":
            raise HTTPException(status_code=403, detail="Invalid authentication scheme")
        
        payload = decode_jwt(credentials.credentials)

        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        return payload

    # async def __call__(self, request: Request):
    #     credentials: HTTPAuthorizationCredentials = await super(
    #         JWTBearer, self
    #     ).__call__(request)
    #     print("Credentials :", credentials)
    #     if credentials:
    #         if not credentials.scheme == "Bearer":
    #             raise HTTPException(
    #                 status_code=403, detail="Invalid authentication token"
    #             )

    #         if not verify_jwt(credentials.credentials):
    #             raise HTTPException(
    #                 status_code=403, detail="Invalid token or expired token"
    #             )

    #         return credentials.credentials
    #     else:
    #         raise HTTPException(status_code=403, detail="Invalid authorization token")
