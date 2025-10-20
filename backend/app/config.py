"""Configuration management for the agent orchestration service."""

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
    github_token: str = "github_pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXX"

    # API Configuration
    api_timeout_seconds: int = 120
    cache_ttl_seconds: int = 3600

    # Logging
    log_level: str = "INFO"


settings = Settings()
