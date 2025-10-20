"""Tests for agent client."""

from unittest.mock import MagicMock, patch

import pytest

from app.services.agent_client import AgentCoreClient, AgentRegistry


@pytest.fixture
def mock_boto_client():
    """Mock boto3 client."""
    with patch("boto3.client") as mock:
        client = MagicMock()
        mock.return_value = client
        yield client


@pytest.mark.asyncio
async def test_invoke_agent_success(mock_boto_client):
    """Test successful agent invocation."""
    # Setup mock response
    mock_response = MagicMock()
    mock_response["response"].read.return_value = b'{"result": "success"}'
    mock_boto_client.invoke_agent_runtime.return_value = mock_response

    # Invoke agent
    client = AgentCoreClient()
    result = await client.invoke_agent(
        "arn:aws:bedrock-agentcore:us-west-2:123:runtime/test", {"test": "data"}
    )

    # Verify
    assert result == {"result": "success"}
    mock_boto_client.invoke_agent_runtime.assert_called_once()


@pytest.mark.asyncio
async def test_invoke_agent_error(mock_boto_client):
    """Test agent invocation error handling."""
    from botocore.exceptions import ClientError

    # Setup mock error
    error = ClientError(
        {"Error": {"Code": "ValidationException", "Message": "Invalid input"}}, "InvokeAgentRuntime"
    )
    mock_boto_client.invoke_agent_runtime.side_effect = error

    # Invoke agent
    client = AgentCoreClient()

    with pytest.raises(Exception) as exc_info:
        await client.invoke_agent(
            "arn:aws:bedrock-agentcore:us-west-2:123:runtime/test", {"test": "data"}
        )

    assert "Invalid input" in str(exc_info.value)


def test_agent_registry():
    """Test agent registry."""
    with patch("app.services.agent_client.settings") as mock_settings:
        mock_settings.project_intelligence_agent_arn = "arn:test:123"

        # Get agent ARN
        arn = AgentRegistry.get_agent_arn("project_intelligence")
        assert arn == "arn:test:123"

        # List agents
        agents = AgentRegistry.list_agents()
        assert "project_intelligence" in agents

        # Unknown agent
        with pytest.raises(ValueError):
            AgentRegistry.get_agent_arn("unknown_agent")
