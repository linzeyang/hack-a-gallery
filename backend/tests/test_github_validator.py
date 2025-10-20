"""Tests for GitHub URL validation service."""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.github_validator import GitHubValidator, RateLimitInfo


class TestGitHubValidator:
    """Test cases for GitHubValidator class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.validator = GitHubValidator()

    def test_validate_url_valid_cases(self):
        """Test URL validation with valid GitHub URLs."""
        valid_urls = [
            "https://github.com/owner/repo",
            "https://github.com/owner/repo/",
            "http://github.com/owner/repo",
            "https://www.github.com/owner/repo",
            "https://github.com/test-user/test-repo",
            "https://github.com/user123/repo_name",
            "https://github.com/a/b",
            "https://github.com/very-long-username-with-39-chars/repo",
        ]

        for url in valid_urls:
            result = self.validator.validate_url(url)
            assert result.is_valid, f"URL should be valid: {url}"
            assert result.owner is not None
            assert result.repo is not None
            assert result.error_message is None

    def test_validate_url_invalid_cases(self):
        """Test URL validation with invalid GitHub URLs."""
        invalid_urls = [
            "",  # Empty string
            "not-a-url",  # Not a URL
            "https://gitlab.com/owner/repo",  # Wrong domain
            "https://github.com/",  # Missing owner/repo
            "https://github.com/owner",  # Missing repo
            "https://github.com/owner/",  # Missing repo
            "https://github.com/-invalid/repo",  # Invalid owner (starts with hyphen)
            "https://github.com/owner/.invalid",  # Invalid repo (starts with period)
            "https://github.com/owner/repo/extra/path",  # Extra path
            "ftp://github.com/owner/repo",  # Wrong protocol
        ]

        for url in invalid_urls:
            result = self.validator.validate_url(url)
            assert not result.is_valid, f"URL should be invalid: {url}"
            assert result.error_message is not None

    def test_validate_url_edge_cases(self):
        """Test URL validation edge cases."""
        # None input
        result = self.validator.validate_url(None)
        assert not result.is_valid
        assert "non-empty string" in result.error_message

        # Non-string input
        result = self.validator.validate_url(123)
        assert not result.is_valid
        assert "non-empty string" in result.error_message

        # Very long username (40 chars - should be invalid)
        long_username = "a" * 40
        result = self.validator.validate_url(f"https://github.com/{long_username}/repo")
        assert not result.is_valid
        assert "Invalid GitHub username" in result.error_message

    def test_github_name_validation(self):
        """Test GitHub username validation rules."""
        # Valid usernames
        valid_names = ["user", "user123", "test-user", "a", "user-123"]
        for name in valid_names:
            assert self.validator._is_valid_github_name(name), f"Should be valid: {name}"

        # Invalid usernames
        invalid_names = [
            "",  # Empty
            "-user",  # Starts with hyphen
            "user-",  # Ends with hyphen
            "user--name",  # Double hyphen
            "a" * 40,  # Too long
            "user@name",  # Invalid character
        ]
        for name in invalid_names:
            assert not self.validator._is_valid_github_name(name), f"Should be invalid: {name}"

    def test_repo_name_validation(self):
        """Test GitHub repository name validation rules."""
        # Valid repo names
        valid_names = ["repo", "repo-name", "repo_name", "repo.name", "123repo", "a"]
        for name in valid_names:
            assert self.validator._is_valid_repo_name(name), f"Should be valid: {name}"

        # Invalid repo names
        invalid_names = [
            "",  # Empty
            ".repo",  # Starts with period
            "-repo",  # Starts with hyphen
            "a" * 101,  # Too long
            "repo@name",  # Invalid character
        ]
        for name in invalid_names:
            assert not self.validator._is_valid_repo_name(name), f"Should be invalid: {name}"

    @pytest.mark.asyncio
    async def test_check_repository_exists_success(self):
        """Test successful repository existence check."""
        with patch.object(self.validator, "_client") as mock_client:
            # Mock successful response
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.headers = {
                "x-ratelimit-remaining": "4999",
                "x-ratelimit-limit": "5000",
                "x-ratelimit-reset": str(int(datetime.now().timestamp()) + 3600),
            }
            mock_client.get = AsyncMock(return_value=mock_response)

            # Mock rate limit check
            with patch.object(self.validator, "get_rate_limit_info") as mock_rate_limit:
                mock_rate_limit.return_value = RateLimitInfo(
                    is_limited=False, remaining=4999, limit=5000
                )

                result = await self.validator.check_repository_exists("owner", "repo")
                assert result is True

                # Verify API call
                mock_client.get.assert_called_once()
                call_args = mock_client.get.call_args
                assert "https://api.github.com/repos/owner/repo" in call_args[0]

    @pytest.mark.asyncio
    async def test_check_repository_exists_not_found(self):
        """Test repository not found case."""
        with patch.object(self.validator, "_client") as mock_client:
            # Mock 404 response
            mock_response = MagicMock()
            mock_response.status_code = 404
            mock_response.headers = {}
            mock_client.get = AsyncMock(return_value=mock_response)

            # Mock rate limit check
            with patch.object(self.validator, "get_rate_limit_info") as mock_rate_limit:
                mock_rate_limit.return_value = RateLimitInfo(
                    is_limited=False, remaining=4999, limit=5000
                )

                result = await self.validator.check_repository_exists("owner", "nonexistent")
                assert result is False

    @pytest.mark.asyncio
    async def test_check_repository_exists_rate_limited(self):
        """Test rate limit handling."""
        # Mock rate limit check to return limited status
        with patch.object(self.validator, "get_rate_limit_info") as mock_rate_limit:
            reset_time = datetime.now()
            mock_rate_limit.return_value = RateLimitInfo(
                is_limited=True, reset_time=reset_time, remaining=0, limit=5000
            )

            with pytest.raises(Exception) as exc_info:
                await self.validator.check_repository_exists("owner", "repo")

            assert "rate limit exceeded" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_check_repository_exists_with_auth(self):
        """Test repository check with authentication."""
        with patch("app.services.github_validator.settings") as mock_settings:
            mock_settings.github_token = "github_pat_valid_token"

            with patch.object(self.validator, "_client") as mock_client:
                mock_response = MagicMock()
                mock_response.status_code = 200
                mock_response.headers = {}
                mock_client.get = AsyncMock(return_value=mock_response)

                with patch.object(self.validator, "get_rate_limit_info") as mock_rate_limit:
                    mock_rate_limit.return_value = RateLimitInfo(
                        is_limited=False, remaining=4999, limit=5000
                    )

                    await self.validator.check_repository_exists("owner", "repo")

                    # Verify authorization header was included
                    call_args = mock_client.get.call_args
                    headers = call_args[1]["headers"]
                    assert "Authorization" in headers
                    assert headers["Authorization"] == "Bearer github_pat_valid_token"

    @pytest.mark.asyncio
    async def test_get_rate_limit_info_success(self):
        """Test successful rate limit info retrieval."""
        with patch.object(self.validator, "_client") as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "resources": {
                    "core": {
                        "limit": 5000,
                        "remaining": 4999,
                        "reset": int(datetime.now().timestamp()) + 3600,
                    }
                }
            }
            mock_client.get = AsyncMock(return_value=mock_response)

            rate_limit_info = await self.validator.get_rate_limit_info()

            assert not rate_limit_info.is_limited
            assert rate_limit_info.remaining == 4999
            assert rate_limit_info.limit == 5000
            assert rate_limit_info.reset_time is not None

    @pytest.mark.asyncio
    async def test_get_rate_limit_info_limited(self):
        """Test rate limit info when limited."""
        with patch.object(self.validator, "_client") as mock_client:
            reset_timestamp = int(datetime.now().timestamp()) + 3600
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "resources": {"core": {"limit": 5000, "remaining": 0, "reset": reset_timestamp}}
            }
            mock_client.get = AsyncMock(return_value=mock_response)

            rate_limit_info = await self.validator.get_rate_limit_info()

            assert rate_limit_info.is_limited
            assert rate_limit_info.remaining == 0
            assert rate_limit_info.limit == 5000
            assert rate_limit_info.reset_time is not None

    def test_is_rate_limited_no_cache(self):
        """Test rate limit check with no cached data."""
        is_limited, reset_time = self.validator.is_rate_limited()
        assert not is_limited
        assert reset_time is None

    def test_is_rate_limited_with_cache(self):
        """Test rate limit check with cached data."""
        # Set up cached rate limit info
        reset_time = datetime.now()
        self.validator._rate_limit_cache = RateLimitInfo(
            is_limited=True, reset_time=reset_time, remaining=0, limit=5000
        )
        self.validator._cache_expiry = datetime.now().replace(year=2030)  # Far future

        is_limited, cached_reset_time = self.validator.is_rate_limited()
        assert is_limited
        assert cached_reset_time == reset_time

    def test_update_rate_limit_cache(self):
        """Test rate limit cache update from headers."""
        headers = {
            "x-ratelimit-remaining": "100",
            "x-ratelimit-limit": "5000",
            "x-ratelimit-reset": str(int(datetime.now().timestamp()) + 3600),
        }

        self.validator._update_rate_limit_cache(headers)

        assert self.validator._rate_limit_cache is not None
        assert self.validator._rate_limit_cache.remaining == 100
        assert self.validator._rate_limit_cache.limit == 5000
        assert not self.validator._rate_limit_cache.is_limited

    def test_update_rate_limit_cache_invalid_headers(self):
        """Test rate limit cache update with invalid headers."""
        headers = {
            "x-ratelimit-remaining": "invalid",
            "x-ratelimit-limit": "also-invalid",
        }

        # Should not raise exception
        self.validator._update_rate_limit_cache(headers)

    @pytest.mark.asyncio
    async def test_context_manager(self):
        """Test async context manager functionality."""
        async with GitHubValidator() as validator:
            assert isinstance(validator, GitHubValidator)
            # Verify client is available
            assert validator._client is not None

    def test_get_github_validator_singleton(self):
        """Test that get_github_validator returns singleton instance."""
        from app.services.github_validator import get_github_validator

        validator1 = get_github_validator()
        validator2 = get_github_validator()

        assert validator1 is validator2  # Same instance
