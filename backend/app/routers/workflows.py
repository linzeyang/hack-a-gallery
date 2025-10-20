"""Multi-agent workflow endpoints (future expansion)."""

import logging
import uuid

from fastapi import APIRouter, HTTPException

from app.models import WorkflowRequest, WorkflowResponse
from app.services.orchestrator import AgentOrchestrator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/workflows", tags=["workflows"])


@router.post("/execute", response_model=WorkflowResponse)
async def execute_workflow(request: WorkflowRequest) -> WorkflowResponse:
    """
    Execute a multi-agent workflow.

    This endpoint allows orchestrating multiple agents with different execution patterns:
    - sequential: Execute agents one after another
    - parallel: Execute agents concurrently
    - conditional: Execute agents based on previous results

    Example workflow:
    {
        "workflow_type": "sequential",
        "tasks": [
            {
                "agent_name": "project_intelligence",
                "input_data": {"repository_url": "https://github.com/owner/repo"}
            },
            {
                "agent_name": "code_review",
                "input_data": {},
                "depends_on": ["project_intelligence"]
            }
        ]
    }
    """
    request_id = str(uuid.uuid4())

    logger.info(
        f"[{request_id}] Executing {request.workflow_type} workflow with {len(request.tasks)} tasks"
    )

    try:
        orchestrator = AgentOrchestrator()
        result = await orchestrator.execute_workflow(request)

        logger.info(f"[{request_id}] Workflow completed in {result['total_time_ms']}ms")

        return WorkflowResponse(
            success=True,
            results=result["results"],
            execution_order=result["execution_order"],
            total_time_ms=result["total_time_ms"],
        )

    except Exception as e:
        logger.error(f"[{request_id}] Workflow execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")


@router.get("/agents")
async def list_agents() -> dict[str, list[str]]:
    """List all available agents."""
    from app.services.agent_client import AgentRegistry

    return {"agents": AgentRegistry.list_agents()}
