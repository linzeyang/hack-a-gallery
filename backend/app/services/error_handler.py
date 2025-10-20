"""Comprehensive error handling and response formatting service."""

import logging
import traceback
from datetime import UTC, datetime
from typing import Any

import httpx
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from app.models import ErrorDetail, StandardErrorResponse

logger = logging.getLogger(__name__)


class ErrorCode:
    """Standard error codes for the application."""

    # Validation errors (4xx)
    INVALID_URL = "INVALID_URL"
    INVALID_REQUEST = "INVALID_REQUEST"
    REPOSITORY_NOT_FOUND = "REPOSITORY_NOT_FOUND"
    RATE_LIMITED = "RATE_LIMITED"
    UNAUTHORIZED = "UNAUTHORIZED"

    # Server errors (5xx)
    AGENT_INVOCATION_FAILED = "AGENT_INVOCATION_FAILED"
    AGENT_TIMEOUT = "AGENT_TIMEOUT"
    GITHUB_API_ERROR = "GITHUB_API_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"

    # Network errors
    NETWORK_TIMEOUT = "NETWORK_TIMEOUT"
    CONNECTION_ERROR = "CONNECTION_ERROR"


class ErrorHandler:
    """
    Centralized error handling service for structured error responses.

    Provides consistent error formatting, logging, and response generation
    with proper HTTP status codes and request ID tracking.
    """

    @staticmethod
    def create_error_detail(
        code: str, message: str, details: dict[str, Any] | None = None
    ) -> ErrorDetail:
        """
        Create a standardized error detail object.

        Args:
            code: Error code for programmatic handling
            message: Human-readable error message
            details: Additional error context

        Returns:
            ErrorDetail object with timestamp
        """
        return ErrorDetail(
            code=code,
            message=message,
            details=details or {},
            timestamp=datetime.now(UTC).isoformat(),
        )

    @staticmethod
    def create_error_response(request_id: str, error_detail: ErrorDetail) -> StandardErrorResponse:
        """
        Create a standardized error response.

        Args:
            request_id: Unique request identifier
            error_detail: Error details

        Returns:
            StandardErrorResponse object
        """
        return StandardErrorResponse(error=error_detail, request_id=request_id)

    @staticmethod
    def log_error(
        request_id: str,
        error_code: str,
        message: str,
        exception: Exception | None = None,
        extra_context: dict[str, Any] | None = None,
    ) -> None:
        """
        Log error with structured format for CloudWatch.

        Args:
            request_id: Unique request identifier
            error_code: Error code
            message: Error message
            exception: Original exception (if any)
            extra_context: Additional context for logging
        """
        log_data = {
            "request_id": request_id,
            "error_code": error_code,
            "error_message": message,  # Renamed to avoid conflict with logging 'message'
            "timestamp": datetime.now(UTC).isoformat(),
        }

        if extra_context:
            log_data.update(extra_context)

        if exception:
            log_data.update(
                {
                    "exception_type": type(exception).__name__,
                    "exception_message": str(exception),
                    "traceback": traceback.format_exc(),
                }
            )

        logger.error(f"[{request_id}] {error_code}: {message}", extra=log_data)

    @classmethod
    def handle_validation_error(
        cls, request_id: str, message: str, details: dict[str, Any] | None = None
    ) -> HTTPException:
        """
        Handle validation errors (400 Bad Request).

        Args:
            request_id: Unique request identifier
            message: Error message
            details: Additional error context

        Returns:
            HTTPException with structured error response
        """
        error_detail = cls.create_error_detail(
            code=ErrorCode.INVALID_REQUEST, message=message, details=details
        )

        cls.log_error(request_id, ErrorCode.INVALID_REQUEST, message)

        error_response = cls.create_error_response(request_id, error_detail)

        raise HTTPException(status_code=400, detail=error_response.model_dump())

    @classmethod
    def handle_github_url_error(cls, request_id: str, message: str) -> HTTPException:
        """
        Handle GitHub URL validation errors.

        Args:
            request_id: Unique request identifier
            message: Error message

        Returns:
            HTTPException with structured error response
        """
        error_detail = cls.create_error_detail(
            code=ErrorCode.INVALID_URL,
            message=message,
            details={"expected_format": "https://github.com/owner/repo"},
        )

        cls.log_error(request_id, ErrorCode.INVALID_URL, message)

        error_response = cls.create_error_response(request_id, error_detail)

        raise HTTPException(status_code=400, detail=error_response.model_dump())

    @classmethod
    def handle_repository_not_found(cls, request_id: str, repository_url: str) -> HTTPException:
        """
        Handle repository not found errors.

        Args:
            request_id: Unique request identifier
            repository_url: Repository URL that was not found

        Returns:
            HTTPException with structured error response
        """
        error_detail = cls.create_error_detail(
            code=ErrorCode.REPOSITORY_NOT_FOUND,
            message="Repository not found or is private",
            details={"repository_url": repository_url},
        )

        cls.log_error(
            request_id,
            ErrorCode.REPOSITORY_NOT_FOUND,
            f"Repository not accessible: {repository_url}",
        )

        error_response = cls.create_error_response(request_id, error_detail)

        raise HTTPException(status_code=404, detail=error_response.model_dump())

    @classmethod
    def handle_rate_limit_error(
        cls, request_id: str, reset_time: str | None = None
    ) -> HTTPException:
        """
        Handle rate limit errors.

        Args:
            request_id: Unique request identifier
            reset_time: When rate limit resets (if available)

        Returns:
            HTTPException with structured error response
        """
        details = {}
        if reset_time:
            details["reset_time"] = reset_time

        error_detail = cls.create_error_detail(
            code=ErrorCode.RATE_LIMITED,
            message="GitHub API rate limit exceeded. Please try again later.",
            details=details,
        )

        cls.log_error(request_id, ErrorCode.RATE_LIMITED, "GitHub API rate limit exceeded")

        error_response = cls.create_error_response(request_id, error_detail)

        raise HTTPException(
            status_code=429,
            detail=error_response.model_dump(),
            headers={"Retry-After": "3600"} if not reset_time else {},
        )

    @classmethod
    def handle_agent_timeout(cls, request_id: str, timeout_seconds: int) -> HTTPException:
        """
        Handle agent invocation timeout errors.

        Args:
            request_id: Unique request identifier
            timeout_seconds: Timeout duration in seconds

        Returns:
            HTTPException with structured error response
        """
        error_detail = cls.create_error_detail(
            code=ErrorCode.AGENT_TIMEOUT,
            message=f"Agent analysis timed out after {timeout_seconds} seconds",
            details={"timeout_seconds": timeout_seconds},
        )

        cls.log_error(
            request_id, ErrorCode.AGENT_TIMEOUT, f"Agent timeout after {timeout_seconds}s"
        )

        error_response = cls.create_error_response(request_id, error_detail)

        raise HTTPException(status_code=504, detail=error_response.model_dump())

    @classmethod
    def handle_agent_error(cls, request_id: str, exception: Exception) -> HTTPException:
        """
        Handle agent invocation errors.

        Args:
            request_id: Unique request identifier
            exception: Original exception

        Returns:
            HTTPException with structured error response
        """
        # Check for specific error types
        if isinstance(exception, httpx.TimeoutException):
            return cls.handle_network_timeout(request_id, str(exception))

        error_detail = cls.create_error_detail(
            code=ErrorCode.AGENT_INVOCATION_FAILED,
            message="Failed to analyze project with AI agent",
            details={"error_type": type(exception).__name__},
        )

        cls.log_error(
            request_id,
            ErrorCode.AGENT_INVOCATION_FAILED,
            "Agent invocation failed",
            exception=exception,
        )

        error_response = cls.create_error_response(request_id, error_detail)

        raise HTTPException(status_code=503, detail=error_response.model_dump())

    @classmethod
    def handle_network_timeout(cls, request_id: str, service: str) -> HTTPException:
        """
        Handle network timeout errors.

        Args:
            request_id: Unique request identifier
            service: Service that timed out

        Returns:
            HTTPException with structured error response
        """
        error_detail = cls.create_error_detail(
            code=ErrorCode.NETWORK_TIMEOUT,
            message=f"Network timeout while connecting to {service}",
            details={"service": service},
        )

        cls.log_error(request_id, ErrorCode.NETWORK_TIMEOUT, f"Network timeout: {service}")

        error_response = cls.create_error_response(request_id, error_detail)

        raise HTTPException(status_code=504, detail=error_response.model_dump())

    @classmethod
    def handle_internal_error(cls, request_id: str, exception: Exception) -> HTTPException:
        """
        Handle unexpected internal errors.

        Args:
            request_id: Unique request identifier
            exception: Original exception

        Returns:
            HTTPException with structured error response
        """
        error_detail = cls.create_error_detail(
            code=ErrorCode.INTERNAL_ERROR,
            message="An unexpected error occurred while processing your request",
            details={"error_type": type(exception).__name__},
        )

        cls.log_error(
            request_id, ErrorCode.INTERNAL_ERROR, "Unexpected internal error", exception=exception
        )

        error_response = cls.create_error_response(request_id, error_detail)

        raise HTTPException(status_code=500, detail=error_response.model_dump())


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse | None:
    """
    Global exception handler for unhandled exceptions.

    Args:
        request: FastAPI request object
        exc: Unhandled exception

    Returns:
        JSONResponse with structured error or None if handled
    """
    # Generate request ID if not available
    request_id = getattr(request.state, "request_id", "unknown")

    # Handle HTTPException (already processed)
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    # Handle unexpected exceptions
    error_handler = ErrorHandler()
    try:
        error_handler.handle_internal_error(request_id, exc)
    except HTTPException as http_exc:
        return JSONResponse(status_code=http_exc.status_code, content=http_exc.detail)


def setup_error_logging() -> None:
    """
    Configure structured logging for CloudWatch integration.

    Sets up JSON formatting and appropriate log levels for production use.
    """
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Set specific log levels
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)

    # Configure application logger
    app_logger = logging.getLogger("app")
    app_logger.setLevel(logging.INFO)

    logger.info("Error handling and logging configured for CloudWatch integration")
