"""Configuration management for the agent orchestration service."""

import os

import boto3
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # AWS Configuration
    aws_region: str = "us-west-2"

    # Agent Runtime ARNs (expandable for multiple agents)
    project_intelligence_agent_arn: str = (
        "arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/agent-name-XXXXX"
    )
    # Future agents can be added here:
    # code_review_agent_arn: str = "arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/code-review-XXXXX"
    # orchestrator_agent_arn: str = "arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/orchestrator-XXXXX"

    # GitHub Configuration
    github_token_param_name: str = "/hackagallery/github-token"
    _github_token = None

    # API Configuration
    api_timeout_seconds: int = 120
    cache_ttl_seconds: int = 3600

    # Logging
    log_level: str = "INFO"

    @property
    def github_token(self) -> str:
        """Get GitHub token from Parameter Store, with caching."""
        if self._github_token is None:
            try:
                # Get the parameter name from environment variable
                param_name = os.getenv("GITHUB_TOKEN_PARAM_NAME", self.github_token_param_name)

                # Create SSM client
                ssm = boto3.client("ssm", region_name=self.aws_region)

                # Fetch the parameter
                response = ssm.get_parameter(Name=param_name, WithDecryption=True)

                self._github_token = response["Parameter"]["Value"]
            except Exception as e:
                # Fallback to placeholder if parameter fetch fails
                print(f"Warning: Could not fetch GitHub token from Parameter Store: {e}")
                self._github_token = "github_pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXX"

        return self._github_token


settings = Settings()
