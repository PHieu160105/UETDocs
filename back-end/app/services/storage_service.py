from datetime import timedelta
from pathlib import Path
import uuid

from fastapi import HTTPException

from app.core.config import settings
from app.core.storage import ObjectStorageClient


class MediaService:
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

        The key format keeps files grouped by visibility and folder:
        visibility/folder/uuid.ext
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

        Upload stays presigned for both public and private files.
        Visibility only affects the object key layout and later access URL.
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
        is_public: bool = False,
        expired_minutes: int = 10,
        public_base_url: str | None = None,
    ) -> str:
        """
        Alias for generate_view_url when you want the intent to be explicit.
        """
        return self.generate_view_url(
            object_key,
            is_public=is_public,
            expired_minutes=expired_minutes,
            public_base_url=public_base_url,
        )

    def file_exists(self, object_key: str, *, nullable: bool = True) -> bool:
        """
        Check whether an object exists in the configured bucket.
        """
        if not object_key:
            return False
        return self.storage_client.file_exists(object_key, nullable=nullable)
