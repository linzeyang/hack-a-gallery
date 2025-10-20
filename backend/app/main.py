"""FastAPI application for agent orchestration."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import projects, workflows
from app.services.error_handler import global_exception_handler, setup_error_logging

# Configure logging for CloudWatch integration
setup_error_logging()

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Project Intelligence Agent Orchestration",
    description="Multi-agent orchestration service for project analysis",
    version="0.1.0",
)

# Add global exception handler
app.add_exception_handler(Exception, global_exception_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router)
app.include_router(workflows.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"service": "agent-orchestration", "status": "healthy", "version": "0.1.0"}


@app.get("/health")
async def health():
    """Detailed health check."""
    from app.services.agent_client import AgentRegistry

    return {
        "status": "healthy",
        "agents": AgentRegistry.list_agents(),
        "config": {
            "aws_region": settings.aws_region,
            "cache_ttl": settings.cache_ttl_seconds,
            "timeout": settings.api_timeout_seconds,
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
