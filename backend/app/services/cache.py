"""Simple in-memory cache for analysis results."""

import logging
import time
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


class AnalysisCache:
    """In-memory cache for project analysis results."""

    def __init__(self):
        self._cache: dict[str, tuple[Any, float]] = {}

    def get(self, key: str) -> Any | None:
        """Get cached value if not expired."""
        if key not in self._cache:
            return None

        value, timestamp = self._cache[key]

        # Check if expired
        if time.time() - timestamp > settings.cache_ttl_seconds:
            logger.info(f"Cache expired for key: {key}")
            del self._cache[key]
            return None

        logger.info(f"Cache hit for key: {key}")
        return value

    def set(self, key: str, value: Any) -> None:
        """Cache a value with current timestamp."""
        self._cache[key] = (value, time.time())
        logger.info(f"Cached value for key: {key}")

    def invalidate(self, key: str) -> None:
        """Remove a key from cache."""
        if key in self._cache:
            del self._cache[key]
            logger.info(f"Invalidated cache for key: {key}")

    def clear(self) -> None:
        """Clear all cached values."""
        self._cache.clear()
        logger.info("Cache cleared")


# Global cache instance
cache = AnalysisCache()
