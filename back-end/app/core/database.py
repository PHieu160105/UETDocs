from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def _parse_db_url(raw_url: str) -> tuple[str, dict]:
    parsed = urlparse(raw_url)
    qs = parse_qs(parsed.query, keep_blank_values=True)

    connect_args: dict = {}
    sslmode = qs.pop("sslmode", [None])[0]
    if sslmode in ("require", "verify-ca", "verify-full"):
        connect_args["ssl"] = True

    clean_query = urlencode({k: v[0] for k, v in qs.items()})
    clean_url = urlunparse(parsed._replace(query=clean_query))
    return clean_url, connect_args


_db_url, _connect_args = _parse_db_url(settings.DATABASE_URL)

engine: AsyncEngine = create_async_engine(
    _db_url,
    connect_args=_connect_args,
    echo=settings.is_development,
    poolclass=NullPool,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()  
        except Exception as e:
            await session.rollback()  
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()  

async def init_db():
    from sqlalchemy import text
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version();"))
            version = result.scalar()
            logger.info(f"Connected to PostgreSQL: {str(version)[:60]}...")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

async def close_db():
    await engine.dispose()
    logger.info("Database connection pool closed")