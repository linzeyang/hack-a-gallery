"""Client for invoking Bedrock AgentCore agents."""

import json
import logging
import time
from typing import Any

import boto3
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)


class AgentCoreClient:
    """Client for invoking agents on Bedrock AgentCore Runtime."""

    def __init__(self):
        self.client = boto3.client("bedrock-agentcore", region_name=settings.aws_region)

    async def invoke_agent(
        self,
        agent_arn: str,
        payload: dict[str, Any],
        session_id: str | None = None,
        qualifier: str = "DEFAULT",
        timeout_seconds: int = 30,
    ) -> dict[str, Any]:
        """
        Invoke an agent and return the response with timeout handling.

        Args:
            agent_arn: ARN of the agent runtime
            payload: Input data for the agent
            session_id: Optional session ID (generated if not provided)
            qualifier: Agent version qualifier
            timeout_seconds: Maximum time to wait for response

        Returns:
            Parsed response from the agent

        Raises:
            TimeoutError: If invocation exceeds timeout
            Exception: If invocation fails
        """
        if not session_id:
            session_id = self._generate_session_id()

        start_time = time.time()

        try:
            logger.info(f"Invoking agent: {agent_arn} (timeout: {timeout_seconds}s)")

            # Encode payload
            payload_bytes = json.dumps(payload).encode("utf-8")

            # Invoke agent with timeout
            response = self.client.invoke_agent_runtime(
                runtimeSessionId=session_id,
                agentRuntimeArn=agent_arn,
                qualifier=qualifier,
                payload=payload_bytes,
            )

            # Check if operation exceeded timeout
            elapsed_time = time.time() - start_time
            if elapsed_time > timeout_seconds:
                raise TimeoutError(f"Agent invocation exceeded {timeout_seconds}s timeout")

            # Parse response
            response_text = response["response"].read().decode("utf-8")
            result = json.loads(response_text)

            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.info(f"Agent invocation completed in {elapsed_ms}ms")

            return result

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_msg = e.response["Error"]["Message"]
            logger.error(f"Agent invocation failed: {error_code} - {error_msg}")
            raise Exception(f"Agent invocation failed: {error_msg}")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse agent response: {e}")
            raise Exception("Invalid response format from agent")

        except TimeoutError:
            logger.error(f"Agent invocation timed out after {timeout_seconds}s")
            raise

        except Exception as e:
            logger.error(f"Unexpected error during agent invocation: {e}")
            raise

    def _generate_session_id(self) -> str:
        """Generate a unique session ID (must be 33+ characters)."""
        import uuid

        return f"session-{uuid.uuid4().hex}"


# Agent registry for easy expansion
class AgentRegistry:
    """Registry of available agents and their ARNs."""

    @staticmethod
    def get_agent_arn(agent_name: str) -> str:
        """Get the ARN for a named agent."""
        agents = {
            "project_intelligence": settings.project_intelligence_agent_arn,
            # Add more agents here as they're deployed:
            # "code_review": settings.code_review_agent_arn,
            # "orchestrator": settings.orchestrator_agent_arn,
        }

        if agent_name not in agents:
            raise ValueError(f"Unknown agent: {agent_name}")

        return agents[agent_name]

    @staticmethod
    def list_agents() -> list[str]:
        """List all registered agents."""
        return ["project_intelligence"]
