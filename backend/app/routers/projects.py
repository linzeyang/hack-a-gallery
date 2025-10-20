"""Project analysis endpoints."""

import logging
import time
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException

from app.models import AnalysisMetadata, AnalysisResponse, AnalyzeProjectRequest, ProjectAnalysis
from app.services.agent_client import AgentCoreClient, AgentRegistry
from app.services.cache import cache
from app.services.error_handler import ErrorHandler
from app.services.github_validator import get_github_validator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_project(request: AnalyzeProjectRequest) -> AnalysisResponse | None:
    """
    Analyze a GitHub project using the Project Intelligence Agent.

    This endpoint:
    1. Validates the GitHub URL format and accessibility
    2. Checks cache for existing analysis
    3. Invokes the Project Intelligence Agent
    4. Returns structured analysis results
    """
    request_id = str(uuid.uuid4())
    repo_url = str(request.repository_url)

    logger.info(f"[{request_id}] Analyzing project: {repo_url}")

    # Enhanced GitHub URL validation
    validator = get_github_validator()
    validation_result = validator.validate_url(repo_url)

    if not validation_result.is_valid:
        ErrorHandler.handle_github_url_error(
            request_id, validation_result.error_message or "Invalid GitHub URL"
        )

    # Check repository accessibility
    try:
        repo_exists = await validator.check_repository_exists(
            validation_result.owner or "", validation_result.repo or ""
        )
        if not repo_exists:
            ErrorHandler.handle_repository_not_found(request_id, repo_url)
    except HTTPException:
        # Re-raise HTTPExceptions from ErrorHandler (repository not found, rate limit, etc.)
        raise
    except Exception as e:
        if "rate limit" in str(e).lower():
            ErrorHandler.handle_rate_limit_error(request_id)
        else:
            # Log the error and re-raise as internal error
            logger.error(f"[{request_id}] Repository accessibility check failed: {e}")
            ErrorHandler.handle_internal_error(request_id, e)

    # Check cache
    cached_result = cache.get(repo_url)
    if cached_result:
        logger.info(f"[{request_id}] Returning cached result")
        return AnalysisResponse(success=True, data=cached_result, request_id=request_id)

    try:
        start_time = time.time()

        # Get agent client
        client = AgentCoreClient()
        agent_arn = AgentRegistry.get_agent_arn("project_intelligence")

        # Prepare payload
        payload = {"repository_url": repo_url, "request_id": request_id}

        # Invoke agent with timeout handling
        try:
            result = await client.invoke_agent(
                agent_arn,
                payload,
                timeout_seconds=25,  # 25-second timeout as per requirements
            )
        except TimeoutError:
            ErrorHandler.handle_agent_timeout(request_id, 25)
        except Exception as agent_error:
            ErrorHandler.handle_agent_error(request_id, agent_error)

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Extract analysis data from agent response
        # Agent returns: {"request_id": "...", "status": "...", "analysis": {...}}
        analysis_data = result.get("analysis", {})

        # Map agent's tech_stack to backend's technologies
        tech_stack = analysis_data.get("tech_stack", [])

        # Build response
        analysis = ProjectAnalysis(
            summary=analysis_data.get("summary", ""),
            technologies=tech_stack,  # Map tech_stack to technologies
            tags=analysis_data.get("tags", []),
            key_features=analysis_data.get("key_features", []),
            metadata=AnalysisMetadata(
                request_id=request_id,
                agent_name="project_intelligence",
                processing_time_ms=elapsed_ms,
                timestamp=datetime.now(UTC).isoformat(),
            ),
        )

        # Cache result
        cache.set(repo_url, analysis)

        logger.info(f"[{request_id}] Analysis completed in {elapsed_ms}ms")

        return AnalysisResponse(success=True, data=analysis, request_id=request_id)

    except HTTPException:
        # Re-raise HTTPExceptions (already handled by ErrorHandler)
        raise
    except Exception as e:
        # Handle any unexpected errors
        ErrorHandler.handle_internal_error(request_id, e)
