"""
Project Intelligence Agent for HackaGallery

This agent analyzes GitHub repositories to extract technical details,
generate summaries, and categorize projects using Amazon Bedrock Nova models.

Refactored to use the official GitHub MCP server for better maintainability.
"""

import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from logging import Logger
from typing import Any

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from boto3 import session
from botocore.exceptions import ClientError
from dotenv import find_dotenv, load_dotenv
from mcp.client.streamable_http import streamablehttp_client
from strands import Agent
from strands.tools.mcp import MCPClient

# Configure logging for CloudWatch
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger: Logger = logging.getLogger(__name__)

load_dotenv(find_dotenv())

# Initialize BedrockAgentCoreApp
app = BedrockAgentCoreApp()


def _get_github_token() -> str:
    """
    Retrieve GitHub token from AWS Secrets Manager or environment variable.

    Follows AWS official sample code pattern for Secrets Manager access.
    Falls back to environment variable for local development.

    Returns:
        GitHub personal access token

    Raises:
        Exception: If token cannot be retrieved from either source
    """
    secret_name: str = "github-pat-20251020-public-repo-read-only"
    region_name: str = "us-west-2"

    # Try AWS Secrets Manager first (production)
    # Following AWS official sample
    try:
        # Create a Secrets Manager client
        boto_session = session.Session()
        client = boto_session.client(
            service_name="secretsmanager", region_name=region_name
        )

        get_secret_value_response = client.get_secret_value(SecretId=secret_name)

        # Retrieve the secret string
        secret = get_secret_value_response["SecretString"]

        logger.info(
            "Retrieved GitHub token from AWS Secrets Manager",
            extra={"secret_name": secret_name},
        )
        return secret

    except ClientError as e:
        # For a list of exceptions thrown, see
        # https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
        error_code = e.response["Error"]["Code"]
        logger.warning(
            f"Failed to retrieve secret from Secrets Manager: {error_code}",
            extra={"error": str(e)},
        )

        # Fall back to environment variable (local development)
        token = os.environ.get("GITHUB_TOKEN", "")
        if token:
            logger.info("Using GitHub token from environment variable (fallback)")
            return token

        logger.error("No GitHub token found in Secrets Manager or environment")
        raise Exception(
            "GitHub token not found. Set GITHUB_TOKEN env var or configure Secrets Manager."
        )

    except Exception as e:
        logger.error(
            f"Unexpected error retrieving GitHub token: {str(e)}",
            exc_info=True,
        )
        # Fall back to environment variable
        token = os.environ.get("GITHUB_TOKEN", "")
        if token:
            logger.info("Using GitHub token from environment variable (fallback)")
            return token

        raise


def _parse_github_url(repo_url: str) -> tuple[str, str]:
    """
    Parse GitHub repository URL to extract owner and repo name.

    Args:
        repo_url: GitHub repository URL

    Returns:
        Tuple of (owner, repo)

    Raises:
        ValueError: If URL format is invalid
    """
    try:
        parts: list[str] = repo_url.rstrip("/").split("/")
        owner: str = parts[-2]
        repo: str = parts[-1]
        return owner, repo
    except (IndexError, AttributeError) as e:
        raise ValueError(
            "Invalid GitHub URL format. Expected: https://github.com/owner/repo"
        ) from e


def _create_analysis_prompt(owner: str, repo: str, repo_url: str) -> str:
    """
    Create the analysis prompt for the agent.

    Args:
        owner: Repository owner
        repo: Repository name
        repo_url: Full repository URL

    Returns:
        Formatted prompt string
    """
    return f"""Analyze the GitHub repository at {repo_url} (owner: {owner}, repo: {repo}).

You have access to GitHub MCP tools. Use them to gather information:
1. Use get_file_contents to read the README file
2. Use search_repositories or get repository metadata to understand the project
3. Use list_commits to see recent activity
4. Use search_code to identify technologies and frameworks

Based on the data you gather, return a JSON object with this exact structure:
{{
  "summary": "2-3 sentence project description based on README and repository metadata",
  "tech_stack": [
    {{"name": "Python", "category": "language", "confidence": 0.95}},
    {{"name": "FastAPI", "category": "framework", "confidence": 0.90}}
  ],
  "key_features": ["Feature 1 from README", "Feature 2 from README", "Feature 3 from README"],
  "tags": [
    {{"name": "ai", "category": "domain", "confidence": 0.85}},
    {{"name": "web-app", "category": "platform", "confidence": 0.90}}
  ],
  "metadata": {{
    "repository_owner": "{owner}",
    "repository_name": "{repo}",
    "primary_language": "Python",
    "language_distribution": {{"Python": 75.5, "JavaScript": 24.5}},
    "star_count": 123,
    "fork_count": 45,
    "last_updated": "2025-10-17T10:00:00Z",
    "has_readme": true,
    "has_tests": false,
    "has_ci": false
  }},
  "confidence_score": 0.92
}}

Guidelines:
- For tech_stack, identify languages, frameworks, libraries, tools, and AWS services
- Categories: "language", "framework", "library", "tool", "aws-service"
- For tags, use categories: "domain", "technology", "feature", "platform"
- Extract key_features from README headings, bullet points, or description
- Provide realistic confidence scores (0.0 to 1.0) based on evidence
- For has_tests, check if repository has test files or test directories
- For has_ci, check if repository has .github/workflows or similar CI configuration
- Overall confidence_score should reflect the quality and completeness of available data
- If you cannot identify some information, use appropriate "null" values or empty arrays
- DO NOT make up information

Return ONLY the JSON object, no additional text or explanation.
"""


def _extract_json_from_response(raw_message: Any) -> dict[str, Any]:
    """
    Extract JSON data from agent response.

    Handles various response formats including:
    - Direct dict responses
    - String responses with JSON
    - Responses with markdown code blocks
    - Structured responses with content arrays

    Args:
        raw_message: Raw response from agent

    Returns:
        Parsed JSON data as dictionary

    Raises:
        json.JSONDecodeError: If JSON parsing fails
    """
    # Handle dict responses
    if isinstance(raw_message, dict):
        # Check for structured response with content array
        if "content" in raw_message and isinstance(raw_message["content"], list):
            text_content = ""
            for item in raw_message["content"]:
                if isinstance(item, dict) and "text" in item:
                    text_content += item["text"]
            return _extract_json_from_text(text_content)
        return raw_message

    # Handle string responses
    if isinstance(raw_message, str):
        return _extract_json_from_text(raw_message)

    # Fallback: convert to string and parse
    return json.loads(str(raw_message))


def _extract_json_from_text(text: str) -> dict[str, Any]:
    """
    Extract JSON object from text content.

    Tries multiple strategies:
    1. Extract from markdown code blocks
    2. Find JSON by counting braces
    3. Parse entire text as JSON

    Args:
        text: Text content potentially containing JSON

    Returns:
        Parsed JSON data as dictionary

    Raises:
        json.JSONDecodeError: If JSON parsing fails
    """
    # Try to extract from markdown code blocks
    json_match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(1))

    # Try to find JSON by counting braces
    start_idx = text.find("{")
    if start_idx != -1:
        brace_count = 0
        end_idx = start_idx
        for i in range(start_idx, len(text)):
            if text[i] == "{":
                brace_count += 1
            elif text[i] == "}":
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    break

        if end_idx > start_idx:
            json_str = text[start_idx:end_idx]
            return json.loads(json_str)

    # Fallback: try to parse entire text
    return json.loads(text)


def _create_fallback_response(
    owner: str, repo: str, raw_message: str
) -> dict[str, Any]:
    """
    Create a fallback response when JSON parsing fails.

    Args:
        owner: Repository owner
        repo: Repository name
        raw_message: Raw message from agent

    Returns:
        Fallback analysis dictionary
    """
    return {
        "summary": raw_message,
        "tech_stack": [],
        "key_features": [],
        "tags": [],
        "metadata": {
            "repository_owner": owner,
            "repository_name": repo,
            "primary_language": "Unknown",
            "language_distribution": {},
            "star_count": 0,
            "fork_count": 0,
            "last_updated": "",
            "has_readme": False,
            "has_tests": False,
            "has_ci": False,
        },
        "confidence_score": 0.5,
    }


@app.entrypoint
def analyze_project(payload: dict) -> dict:
    """
    Main entrypoint for project analysis.

    Analyzes a GitHub repository and returns structured insights including:
    - AI-generated project summary
    - Technology stack with confidence scores
    - Key features extracted from README
    - Categorized tags for discoverability
    - Repository metadata

    Args:
        payload: Dictionary containing:
            - repository_url: GitHub repository URL (required)
            - options: Optional analysis configuration

    Returns:
        Dictionary containing analysis results with structured data
    """
    # Generate unique request ID for tracking
    request_id: str = str(uuid.uuid4())
    start_time: datetime = datetime.now(timezone.utc)

    logger.info(
        "Analysis started",
        extra={
            "request_id": request_id,
            "payload": payload,
            "timestamp": start_time.isoformat(),
        },
    )

    try:
        repo_url: str | None = payload.get("repository_url")

        if not repo_url:
            error_msg = "repository_url is required in payload"
            logger.error(error_msg, extra={"request_id": request_id})
            return {"request_id": request_id, "error": error_msg, "status": "failed"}

        # Parse repository URL
        try:
            owner, repo = _parse_github_url(repo_url)
            logger.info(
                "Repository parsed",
                extra={"request_id": request_id, "owner": owner, "repo": repo},
            )
        except ValueError as e:
            logger.error(
                str(e),
                extra={
                    "request_id": request_id,
                    "repository_url": repo_url,
                },
            )
            return {"request_id": request_id, "error": str(e), "status": "failed"}

        # Get GitHub token for MCP connection
        try:
            github_token = _get_github_token()
        except Exception as token_error:
            error_msg = f"Failed to get GitHub token: {str(token_error)}"
            logger.error(error_msg, extra={"request_id": request_id})
            return {
                "request_id": request_id,
                "error": error_msg,
                "status": "failed",
            }

        # Create MCP client for GitHub
        github_mcp_client = MCPClient(
            lambda: streamablehttp_client(
                url="https://api.githubcopilot.com/mcp/",
                headers={"Authorization": f"Bearer {github_token}"},
                timeout=60,
            )
        )

        # Use MCP client within context manager (REQUIRED by Strands)
        try:
            with github_mcp_client:
                # Get tools from MCP server
                logger.info(
                    "Connecting to GitHub MCP server",
                    extra={"request_id": request_id},
                )
                tools = github_mcp_client.list_tools_sync()
                logger.info(
                    f"Loaded {len(tools)} tools from GitHub MCP server",
                    extra={"request_id": request_id},
                )

                # Create agent with MCP tools
                agent = Agent(model="us.amazon.nova-micro-v1:0", tools=tools)

                # Create analysis prompt
                prompt = _create_analysis_prompt(owner, repo, repo_url)

                logger.info(
                    "Invoking agent with GitHub MCP tools",
                    extra={"request_id": request_id, "repository": f"{owner}/{repo}"},
                )

                # Invoke agent (must be within the context manager)
                result = agent(prompt)

                logger.info(
                    "Agent invocation completed",
                    extra={"request_id": request_id, "repository": f"{owner}/{repo}"},
                )

        except Exception as mcp_error:
            error_msg = f"MCP operation failed: {str(mcp_error)}"
            logger.error(
                error_msg,
                extra={
                    "request_id": request_id,
                    "error": str(mcp_error),
                    "error_type": type(mcp_error).__name__,
                },
                exc_info=True,
            )
            return {
                "request_id": request_id,
                "error": error_msg,
                "status": "failed",
            }

        # Parse response
        try:
            analysis_data = _extract_json_from_response(result.message)

            # Calculate processing duration
            end_time = datetime.now(timezone.utc)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)

            logger.info(
                "Analysis completed successfully",
                extra={
                    "request_id": request_id,
                    "repository": f"{owner}/{repo}",
                    "duration_ms": duration_ms,
                    "tech_stack_count": len(analysis_data.get("tech_stack", [])),
                    "confidence_score": analysis_data.get("confidence_score", 0),
                },
            )

            return {
                "request_id": request_id,
                "status": "completed",
                "analysis": analysis_data,
                "processing_time_ms": duration_ms,
            }

        except (json.JSONDecodeError, AttributeError, KeyError) as json_error:
            # If JSON parsing fails, return fallback response
            raw_message = str(result.message)

            logger.warning(
                "Failed to parse agent response as JSON",
                extra={
                    "request_id": request_id,
                    "error": str(json_error),
                    "raw_message": raw_message[:200],  # Log first 200 chars
                },
            )

            # Calculate processing duration
            end_time = datetime.now(timezone.utc)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)

            return {
                "request_id": request_id,
                "status": "completed",
                "analysis": _create_fallback_response(owner, repo, raw_message),
                "processing_time_ms": duration_ms,
                "warning": "Response was not in expected JSON format",
            }

    except Exception as e:
        # Catch any unexpected errors
        error_msg = f"Unexpected error during analysis: {str(e)}"
        logger.error(
            error_msg,
            extra={
                "request_id": request_id,
                "error": str(e),
                "error_type": type(e).__name__,
            },
            exc_info=True,
        )

        return {"request_id": request_id, "error": error_msg, "status": "failed"}


if __name__ == "__main__":
    # Run the agent locally for testing
    app.run()
