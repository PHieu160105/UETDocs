from datetime import timedelta
from typing import BinaryIO
from pathlib import Path
from urllib.parse import quote
import uuid

from fastapi import HTTPException

from app.core.config import settings
from app.core.storage import ObjectStorageClient


class StorageService:
    def __init__(self):
        self.storage_client = ObjectStorageClient(
            endpoint=settings.R2_ENDPOINT,
            access_key=settings.R2_ACCESS_KEY,
            secret_key=settings.R2_SECRET_KEY,
            bucket_name=settings.R2_BUCKET_NAME,
            region=settings.R2_REGION,
        )

    def build_object_key(
        self,
        original_filename: str,
        *,
        folder: str = "documents",
        visibility: str = "private",
    ) -> str:
        """
        Build a stable object key for upload and later retrieval.
        """
        if not original_filename:
            raise HTTPException(status_code=400, detail="Filename required")

        normalized_visibility = visibility.strip().lower()
        if normalized_visibility not in {"public", "private"}:
            raise HTTPException(status_code=400, detail="Visibility must be 'public' or 'private'")

        file_extension = Path(original_filename).suffix
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        return f"{normalized_visibility}/{folder.strip('/')}/{unique_filename}"

    def generate_upload_url(
        self,
        original_filename: str,
        *,
        folder: str = "documents",
        visibility: str = "private",
        expired_minutes: int = 10,
    ) -> dict:
        """
        Generate a presigned PUT URL for direct upload from frontend.
        """
        try:
            object_key = self.build_object_key(
                original_filename,
                folder=folder,
                visibility=visibility,
            )

            upload_url = self.storage_client.presigned_put_url(
                filename=object_key,
                expires=timedelta(minutes=expired_minutes),
            )

            return {
                "upload_url": upload_url,
                "object_key": object_key,
                "visibility": visibility.strip().lower(),
            }
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Cannot generate upload URL: {str(exc)}",
            )

    def upload_file(
        self,
        file_stream: BinaryIO,
        *,
        original_filename: str,
        content_type: str | None = None,
        file_size: int = -1,
        folder: str = "documents",
        visibility: str = "private",
    ) -> dict:
        if not original_filename:
            raise HTTPException(status_code=400, detail="Filename required")

        try:
            object_key = self.build_object_key(
                original_filename,
                folder=folder,
                visibility=visibility,
            )
            self.storage_client.upload(
                filename=object_key,
                data=file_stream,
                length=file_size,
                content_type=content_type or "application/octet-stream",
            )
            return {
                "object_key": object_key,
                "visibility": visibility.strip().lower(),
            }
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Cannot upload file to storage: {str(exc)}",
            )

    def generate_view_url(
        self,
        object_key: str,
        *,
        is_public: bool = False,
        expired_minutes: int = 10,
        public_base_url: str | None = None,
    ) -> str:
        """
        Generate a URL for viewing/downloading an object.

        Public files return a stable public URL.
        Private files return a presigned GET URL.
        """
        if not object_key:
            return ""

        try:
            if is_public:
                return self.storage_client.public_url(
                    object_key,
                    public_base_url=public_base_url,
                )

            return self.storage_client.presigned_get_url(
                filename=object_key,
                nullable=True,
                expires=timedelta(minutes=expired_minutes),
            )
        except Exception:
            return ""

    def generate_download_url(
        self,
        object_key: str,
        *,
        original_filename: str | None = None,
        is_public: bool = False,
        expired_minutes: int = 10,
        public_base_url: str | None = None,
    ) -> str:
        if not object_key:
            return ""

        disposition_name = original_filename or Path(object_key).name
        encoded_name = quote(disposition_name)
        disposition = (
            f'attachment; filename="{disposition_name}"; '
            f"filename*=UTF-8''{encoded_name}"
        )

        try:
            if is_public:
                return self.storage_client.public_url(
                    object_key,
                    public_base_url=public_base_url,
                )

            return self.storage_client.presigned_get_url(
                filename=object_key,
                nullable=True,
                expires=timedelta(minutes=expired_minutes),
                response_headers={
                    "response-content-disposition": disposition,
                },
            )
        except Exception:
            return ""

    def get_text_content(self, object_key: str, *, encoding: str = "utf-8") -> str:
        if not object_key:
            raise HTTPException(status_code=404, detail="File not found")

        try:
            payload = self.storage_client.get_object_bytes(
                object_key,
                nullable=False,
            )
            return payload.decode(encoding, errors="replace")
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Cannot read file content: {str(exc)}",
            )

    def file_exists(self, object_key: str, *, nullable: bool = True) -> bool:
        if not object_key:
            return False
        return self.storage_client.file_exists(object_key, nullable=nullable)
