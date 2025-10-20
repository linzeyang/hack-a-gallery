"""GitHub URL validation and repository accessibility service."""

import logging
import re
from datetime import datetime, timedelta
from typing import NamedTuple

import httpx
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)


class ValidationResult(NamedTuple):
    """Result of GitHub URL validation."""

    is_valid: bool
    owner: str | None = None
    repo: str | None = None
    error_message: str | None = None


class RateLimitInfo(BaseModel):
    """GitHub API rate limit information."""

    is_limited: bool
    reset_time: datetime | None = None
    remaining: int = 0
    limit: int = 0


class GitHubValidator:
    """
    GitHub URL validation and repository accessibility service.

    Provides comprehensive validation for GitHub repository URLs including:
    - URL format validation with regex
    - GitHub domain verification
    - Repository existence checking via GitHub API
    - Rate limit detection and handling
    """

    # GitHub URL regex pattern - More permissive to allow detailed validation later
    GITHUB_URL_PATTERN = re.compile(
        r"^https?://(?:www\.)?github\.com/([a-zA-Z0-9][a-zA-Z0-9._-]*)/([a-zA-Z0-9][a-zA-Z0-9._-]*)/?$"
    )

    def __init__(self):
        """Initialize the GitHub validator with HTTP client."""
        self._client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": "HackaGallery/1.0",
                "Accept": "application/vnd.github.v3+json",
            },
        )
        self._rate_limit_cache: RateLimitInfo | None = None
        self._cache_expiry: datetime | None = None

    def validate_url(self, url: str) -> ValidationResult:
        """
        Validate GitHub URL format and extract owner/repo information.

        Args:
            url: GitHub repository URL to validate

        Returns:
            ValidationResult with validation status and extracted information
        """
        if not url or not isinstance(url, str):
            return ValidationResult(is_valid=False, error_message="URL must be a non-empty string")

        # Remove trailing whitespace and normalize
        url = url.strip()

        # Check if URL matches GitHub pattern
        match = self.GITHUB_URL_PATTERN.match(url)
        if not match:
            return ValidationResult(
                is_valid=False,
                error_message="Invalid GitHub URL format. Expected: https://github.com/owner/repo",
            )

        owner, repo = match.groups()

        # Additional validation for owner and repo names
        if not self._is_valid_github_name(owner):
            return ValidationResult(
                is_valid=False, error_message=f"Invalid GitHub username: {owner}"
            )

        if not self._is_valid_repo_name(repo):
            return ValidationResult(
                is_valid=False, error_message=f"Invalid GitHub repository name: {repo}"
            )

        return ValidationResult(is_valid=True, owner=owner, repo=repo)

    async def check_repository_exists(self, owner: str, repo: str) -> bool:
        """
        Check if a GitHub repository exists and is accessible.

        Args:
            owner: Repository owner username
            repo: Repository name

        Returns:
            True if repository exists and is accessible, False otherwise

        Raises:
            httpx.HTTPError: If there's a network error
            Exception: If rate limited or other API errors
        """
        # Check rate limits first
        rate_limit_info = await self.get_rate_limit_info()
        if rate_limit_info.is_limited:
            raise Exception(
                f"GitHub API rate limit exceeded. Resets at {rate_limit_info.reset_time}"
            )

        try:
            # Use GitHub API to check repository existence
            url = f"https://api.github.com/repos/{owner}/{repo}"
            headers = {}

            # Add authentication if GitHub token is available
            if (
                settings.github_token
                and settings.github_token != "github_pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            ):
                headers["Authorization"] = f"Bearer {settings.github_token}"

            response = await self._client.get(url, headers=headers)

            # Update rate limit cache from response headers
            self._update_rate_limit_cache(response.headers)

            match response.status_code:
                case 200:
                    # Repository exists and is accessible
                    logger.info(f"Repository {owner}/{repo} exists and is accessible")
                    return True
                case 404:
                    # Repository doesn't exist or is private
                    logger.info(f"Repository {owner}/{repo} not found or is private")
                    return False
                case 403:
                    # Rate limited or access forbidden
                    if "rate limit" in response.text.lower():
                        raise Exception("GitHub API rate limit exceeded")
                    logger.warning(f"Access forbidden to repository {owner}/{repo}")
                    return False
                case _:
                    # Other HTTP errors
                    logger.error(f"GitHub API error {response.status_code}: {response.text}")
                    raise Exception(f"GitHub API error: {response.status_code}")

        except httpx.TimeoutException:
            logger.error(f"Timeout checking repository {owner}/{repo}")
            raise Exception("GitHub API request timeout")
        except httpx.NetworkError as e:
            logger.error(f"Network error checking repository {owner}/{repo}: {e}")
            raise Exception(f"Network error: {e}")

    async def get_rate_limit_info(self) -> RateLimitInfo:
        """
        Get current GitHub API rate limit status.

        Returns:
            RateLimitInfo with current rate limit status
        """
        # Return cached info if still valid
        if self._rate_limit_cache and self._cache_expiry and datetime.now() < self._cache_expiry:
            return self._rate_limit_cache

        try:
            headers = {}
            if (
                settings.github_token
                and settings.github_token != "github_pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            ):
                headers["Authorization"] = f"Bearer {settings.github_token}"

            response = await self._client.get("https://api.github.com/rate_limit", headers=headers)

            if response.status_code == 200:
                data = response.json()
                core_limit = data["resources"]["core"]

                reset_time = datetime.fromtimestamp(core_limit["reset"])
                is_limited = core_limit["remaining"] <= 0

                rate_limit_info = RateLimitInfo(
                    is_limited=is_limited,
                    reset_time=reset_time,  # Always include reset_time
                    remaining=core_limit["remaining"],
                    limit=core_limit["limit"],
                )

                # Cache for 1 minute
                self._rate_limit_cache = rate_limit_info
                self._cache_expiry = datetime.now() + timedelta(minutes=1)

                return rate_limit_info
            else:
                # Fallback to header-based detection
                return self._get_rate_limit_from_headers(response.headers)

        except Exception as e:
            logger.warning(f"Failed to get rate limit info: {e}")
            # Return conservative estimate
            return RateLimitInfo(is_limited=False, remaining=1000, limit=5000)

    def is_rate_limited(self) -> tuple[bool, datetime | None]:
        """
        Check if currently rate limited (synchronous version).

        Returns:
            Tuple of (is_limited, reset_time)
        """
        if self._rate_limit_cache and self._cache_expiry and datetime.now() < self._cache_expiry:
            return (self._rate_limit_cache.is_limited, self._rate_limit_cache.reset_time)

        # No cached info available
        return False, None

    def _is_valid_github_name(self, name: str) -> bool:
        """
        Validate GitHub username format.

        Args:
            name: Username to validate

        Returns:
            True if valid GitHub username format
        """
        if not name or len(name) > 39:
            return False

        # GitHub username rules:
        # - May only contain alphanumeric characters or single hyphens
        # - Cannot begin or end with a hyphen
        # - Maximum 39 characters
        pattern = re.compile(r"^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$")
        return bool(pattern.match(name))

    def _is_valid_repo_name(self, name: str) -> bool:
        """
        Validate GitHub repository name format.

        Args:
            name: Repository name to validate

        Returns:
            True if valid GitHub repository name format
        """
        if not name or len(name) > 100:
            return False

        # GitHub repository name rules:
        # - Can contain alphanumeric characters, hyphens, underscores, and periods
        # - Cannot start with a period or hyphen
        # - Maximum 100 characters
        pattern = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]*$")
        return bool(pattern.match(name))

    def _update_rate_limit_cache(self, headers: dict) -> None:
        """
        Update rate limit cache from GitHub API response headers.

        Args:
            headers: HTTP response headers from GitHub API
        """
        try:
            remaining = int(headers.get("x-ratelimit-remaining", 1000))
            limit = int(headers.get("x-ratelimit-limit", 5000))
            reset_timestamp = int(headers.get("x-ratelimit-reset", 0))

            reset_time = datetime.fromtimestamp(reset_timestamp) if reset_timestamp else None
            is_limited = remaining <= 0

            self._rate_limit_cache = RateLimitInfo(
                is_limited=is_limited,
                reset_time=reset_time if is_limited else None,
                remaining=remaining,
                limit=limit,
            )

            # Cache for 1 minute
            self._cache_expiry = datetime.now() + timedelta(minutes=1)

        except (ValueError, TypeError) as e:
            logger.warning(f"Failed to parse rate limit headers: {e}")

    def _get_rate_limit_from_headers(self, headers: dict) -> RateLimitInfo:
        """
        Extract rate limit info from response headers.

        Args:
            headers: HTTP response headers

        Returns:
            RateLimitInfo extracted from headers
        """
        try:
            remaining = int(headers.get("x-ratelimit-remaining", 1000))
            limit = int(headers.get("x-ratelimit-limit", 5000))
            reset_timestamp = int(headers.get("x-ratelimit-reset", 0))

            reset_time = datetime.fromtimestamp(reset_timestamp) if reset_timestamp else None
            is_limited = remaining <= 0

            return RateLimitInfo(
                is_limited=is_limited,
                reset_time=reset_time if is_limited else None,
                remaining=remaining,
                limit=limit,
            )
        except (ValueError, TypeError):
            # Fallback values
            return RateLimitInfo(is_limited=False, remaining=1000, limit=5000)

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self._client.aclose()


# Global validator instance
_validator_instance: GitHubValidator | None = None


def get_github_validator() -> GitHubValidator:
    """
    Get or create a global GitHubValidator instance.

    Returns:
        GitHubValidator instance
    """
    global _validator_instance
    if _validator_instance is None:
        _validator_instance = GitHubValidator()
    return _validator_instance
