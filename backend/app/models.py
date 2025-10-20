"""Pydantic models for API requests and responses."""

from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl


# Request Models
class AnalyzeProjectRequest(BaseModel):
    """Request to analyze a GitHub project."""

    repository_url: HttpUrl = Field(
        ...,
        description="GitHub repository URL to analyze",
        examples=["https://github.com/owner/repo"],
    )


# Response Models
class TechnologyItem(BaseModel):
    """Technology detected in the project."""

    name: str
    category: str
    confidence: float = Field(ge=0.0, le=1.0)


class TagItem(BaseModel):
    """Tag for categorizing the project."""

    name: str
    category: str


class AnalysisMetadata(BaseModel):
    """Metadata about the analysis."""

    request_id: str
    agent_name: str
    processing_time_ms: int
    timestamp: str


class ProjectAnalysis(BaseModel):
    """Complete project analysis result."""

    summary: str
    technologies: list[TechnologyItem]
    tags: list[TagItem]
    key_features: list[str]
    metadata: AnalysisMetadata


class ErrorDetail(BaseModel):
    """Detailed error information for API responses."""

    code: str = Field(..., description="Error code for programmatic handling")
    message: str = Field(..., description="Human-readable error message")
    details: dict[str, Any] | None = Field(None, description="Additional error context")
    timestamp: str = Field(..., description="ISO timestamp when error occurred")


class StandardErrorResponse(BaseModel):
    """Standardized error response format."""

    success: bool = Field(False, description="Always false for error responses")
    error: ErrorDetail = Field(..., description="Error details")
    request_id: str = Field(..., description="Unique request identifier")


class AnalysisResponse(BaseModel):
    """API response for project analysis."""

    success: bool
    data: ProjectAnalysis | None = None
    error: ErrorDetail | None = None
    request_id: str = Field(..., description="Unique request identifier")


# Orchestration Models (for future multi-agent workflows)
class AgentTask(BaseModel):
    """A task to be executed by an agent."""

    agent_name: str
    input_data: dict[str, Any]
    depends_on: list[str] = Field(default_factory=list)


class WorkflowRequest(BaseModel):
    """Request to execute a multi-agent workflow."""

    workflow_type: Literal["sequential", "parallel", "conditional"]
    tasks: list[AgentTask]


class WorkflowResponse(BaseModel):
    """Response from a multi-agent workflow."""

    success: bool
    results: dict[str, Any]
    execution_order: list[str]
    total_time_ms: int
    error: str | None = None
