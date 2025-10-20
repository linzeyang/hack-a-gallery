"""Tests for error handling service."""

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.models import ErrorDetail
from app.services.error_handler import ErrorCode, ErrorHandler


class TestErrorHandler:
    """Test cases for ErrorHandler class."""

    def test_create_error_detail(self):
        """Test error detail creation."""
        error_detail = ErrorHandler.create_error_detail(
            code="TEST_ERROR", message="Test error message", details={"key": "value"}
        )

        assert error_detail.code == "TEST_ERROR"
        assert error_detail.message == "Test error message"
        assert error_detail.details == {"key": "value"}
        assert error_detail.timestamp is not None

        # Verify timestamp format
        datetime.fromisoformat(error_detail.timestamp.replace("Z", "+00:00"))

    def test_create_error_detail_no_details(self):
        """Test error detail creation without details."""
        error_detail = ErrorHandler.create_error_detail(
            code="TEST_ERROR", message="Test error message"
        )

        assert error_detail.code == "TEST_ERROR"
        assert error_detail.message == "Test error message"
        assert error_detail.details == {}

    def test_create_error_response(self):
        """Test error response creation."""
        error_detail = ErrorDetail(
            code="TEST_ERROR", message="Test message", details={}, timestamp="2025-10-20T10:00:00Z"
        )

        error_response = ErrorHandler.create_error_response(
            request_id="test-123", error_detail=error_detail
        )

        assert error_response.success is False
        assert error_response.error == error_detail
        assert error_response.request_id == "test-123"

    @patch("app.services.error_handler.logger")
    def test_log_error_basic(self, mock_logger):
        """Test basic error logging."""
        ErrorHandler.log_error(request_id="test-123", error_code="TEST_ERROR", message="Test error")

        mock_logger.error.assert_called_once()
        call_args = mock_logger.error.call_args
        assert "[test-123]" in call_args[0][0]
        assert "TEST_ERROR" in call_args[0][0]
        assert "Test error" in call_args[0][0]

    @patch("app.services.error_handler.logger")
    def test_log_error_with_exception(self, mock_logger):
        """Test error logging with exception."""
        test_exception = ValueError("Test exception")

        ErrorHandler.log_error(
            request_id="test-123",
            error_code="TEST_ERROR",
            message="Test error",
            exception=test_exception,
            extra_context={"context": "test"},
        )

        mock_logger.error.assert_called_once()
        call_args = mock_logger.error.call_args

        # Check log message
        assert "[test-123]" in call_args[0][0]

        # Check extra data
        extra_data = call_args[1]["extra"]
        assert extra_data["request_id"] == "test-123"
        assert extra_data["error_code"] == "TEST_ERROR"
        assert extra_data["exception_type"] == "ValueError"
        assert extra_data["exception_message"] == "Test exception"
        assert extra_data["context"] == "test"

    def test_handle_validation_error(self):
        """Test validation error handling."""
        with pytest.raises(HTTPException) as exc_info:
            ErrorHandler.handle_validation_error(
                request_id="test-123", message="Invalid input", details={"field": "value"}
            )

        assert exc_info.value.status_code == 400

        # Check error response structure
        detail = exc_info.value.detail
        assert detail["success"] is False
        assert detail["request_id"] == "test-123"
        assert detail["error"]["code"] == ErrorCode.INVALID_REQUEST
        assert detail["error"]["message"] == "Invalid input"
        assert detail["error"]["details"]["field"] == "value"

    def test_handle_github_url_error(self):
        """Test GitHub URL error handling."""
        with pytest.raises(HTTPException) as exc_info:
            ErrorHandler.handle_github_url_error(
                request_id="test-123", message="Invalid GitHub URL"
            )

        assert exc_info.value.status_code == 400

        detail = exc_info.value.detail
        assert detail["error"]["code"] == ErrorCode.INVALID_URL
        assert detail["error"]["message"] == "Invalid GitHub URL"
        assert "expected_format" in detail["error"]["details"]

    def test_handle_repository_not_found(self):
        """Test repository not found error handling."""
        with pytest.raises(HTTPException) as exc_info:
            ErrorHandler.handle_repository_not_found(
                request_id="test-123", repository_url="https://github.com/owner/repo"
            )

        assert exc_info.value.status_code == 404

        detail = exc_info.value.detail
        assert detail["error"]["code"] == ErrorCode.REPOSITORY_NOT_FOUND
        assert "Repository not found or is private" in detail["error"]["message"]
        assert detail["error"]["details"]["repository_url"] == "https://github.com/owner/repo"

    def test_handle_rate_limit_error(self):
        """Test rate limit error handling."""
        with pytest.raises(HTTPException) as exc_info:
            ErrorHandler.handle_rate_limit_error(
                request_id="test-123", reset_time="2025-10-20T11:00:00Z"
            )

        assert exc_info.value.status_code == 429

        detail = exc_info.value.detail
        assert detail["error"]["code"] == ErrorCode.RATE_LIMITED
        assert "rate limit exceeded" in detail["error"]["message"].lower()
        assert detail["error"]["details"]["reset_time"] == "2025-10-20T11:00:00Z"

    def test_handle_rate_limit_error_no_reset_time(self):
        """Test rate limit error handling without reset time."""
        with pytest.raises(HTTPException) as exc_info:
            ErrorHandler.handle_rate_limit_error(request_id="test-123")

        assert exc_info.value.status_code == 429
        assert "Retry-After" in exc_info.value.headers

    def test_handle_agent_timeout(self):
        """Test agent timeout error handling."""
        with pytest.raises(HTTPException) as exc_info:
            ErrorHandler.handle_agent_timeout(request_id="test-123", timeout_seconds=30)

        assert exc_info.value.status_code == 504

        detail = exc_info.value.detail
        assert detail["error"]["code"] == ErrorCode.AGENT_TIMEOUT
        assert "timed out after 30 seconds" in detail["error"]["message"]
        assert detail["error"]["details"]["timeout_seconds"] == 30

    def test_handle_agent_error_timeout_exception(self):
        """Test agent error handling with timeout exception."""
        import httpx

        timeout_exception = httpx.TimeoutException("Request timed out")

        with pytest.raises(HTTPException) as exc_info:
            ErrorHandler.handle_agent_error(request_id="test-123", exception=timeout_exception)

        assert exc_info.value.status_code == 504

        detail = exc_info.value.detail
        assert detail["error"]["code"] == ErrorCode.NETWORK_TIMEOUT

    def test_handle_agent_error_generic(self):
        """Test agent error handling with generic exception."""
        test_exception = ValueError("Test error")

        with pytest.raises(HTTPException) as exc_info:
            ErrorHandler.handle_agent_error(request_id="test-123", exception=test_exception)

        assert exc_info.value.status_code == 503

        detail = exc_info.value.detail
        assert detail["error"]["code"] == ErrorCode.AGENT_INVOCATION_FAILED
        assert detail["error"]["details"]["error_type"] == "ValueError"

    def test_handle_network_timeout(self):
        """Test network timeout error handling."""
        with pytest.raises(HTTPException) as exc_info:
            ErrorHandler.handle_network_timeout(request_id="test-123", service="GitHub API")

        assert exc_info.value.status_code == 504

        detail = exc_info.value.detail
        assert detail["error"]["code"] == ErrorCode.NETWORK_TIMEOUT
        assert "GitHub API" in detail["error"]["message"]
        assert detail["error"]["details"]["service"] == "GitHub API"

    def test_handle_internal_error(self):
        """Test internal error handling."""
        test_exception = RuntimeError("Unexpected error")

        with pytest.raises(HTTPException) as exc_info:
            ErrorHandler.handle_internal_error(request_id="test-123", exception=test_exception)

        assert exc_info.value.status_code == 500

        detail = exc_info.value.detail
        assert detail["error"]["code"] == ErrorCode.INTERNAL_ERROR
        assert "unexpected error occurred" in detail["error"]["message"].lower()
        assert detail["error"]["details"]["error_type"] == "RuntimeError"

    def test_error_codes_constants(self):
        """Test that all error codes are defined."""
        # Validation errors
        assert hasattr(ErrorCode, "INVALID_URL")
        assert hasattr(ErrorCode, "INVALID_REQUEST")
        assert hasattr(ErrorCode, "REPOSITORY_NOT_FOUND")
        assert hasattr(ErrorCode, "RATE_LIMITED")

        # Server errors
        assert hasattr(ErrorCode, "AGENT_INVOCATION_FAILED")
        assert hasattr(ErrorCode, "AGENT_TIMEOUT")
        assert hasattr(ErrorCode, "INTERNAL_ERROR")

        # Network errors
        assert hasattr(ErrorCode, "NETWORK_TIMEOUT")
        assert hasattr(ErrorCode, "CONNECTION_ERROR")


class TestGlobalExceptionHandler:
    """Test cases for global exception handler."""

    @pytest.mark.asyncio
    async def test_global_exception_handler_http_exception(self):
        """Test global handler with HTTPException."""
        from fastapi import Request

        from app.services.error_handler import global_exception_handler

        # Mock request
        request = MagicMock(spec=Request)
        request.state.request_id = "test-123"

        # Test HTTPException
        http_exc = HTTPException(status_code=400, detail="Test error")

        response = await global_exception_handler(request, http_exc)

        assert response.status_code == 400
        assert response.body == b'"Test error"'

    @pytest.mark.asyncio
    async def test_global_exception_handler_generic_exception(self):
        """Test global handler with generic exception."""
        from fastapi import Request

        from app.services.error_handler import global_exception_handler

        # Mock request
        request = MagicMock(spec=Request)
        request.state.request_id = "test-123"

        # Test generic exception
        generic_exc = ValueError("Test error")

        response = await global_exception_handler(request, generic_exc)

        assert response.status_code == 500
        # Response should contain structured error


class TestErrorLoggingSetup:
    """Test cases for error logging setup."""

    @patch("app.services.error_handler.logging")
    def test_setup_error_logging(self, mock_logging):
        """Test error logging setup."""
        from app.services.error_handler import setup_error_logging

        setup_error_logging()

        # Verify logging configuration
        mock_logging.basicConfig.assert_called_once()
        mock_logging.getLogger.assert_called()

        # Check that specific loggers are configured
        calls = mock_logging.getLogger.call_args_list
        logger_names = [call[0][0] for call in calls if call[0]]

        assert "httpx" in logger_names
        assert "urllib3" in logger_names
        assert "app" in logger_names
