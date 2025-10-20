# Project Intelligence Agent

AI agent for analyzing GitHub repositories using Amazon Bedrock AgentCore Runtime and the strands-agents framework.

> **🎉 Recently Refactored**: The agent has been refactored to use the official GitHub MCP server for improved maintainability and reliability. See [REFACTORING_README.md](REFACTORING_README.md) for details.

## Overview

This agent analyzes GitHub repositories to extract:
- Project summaries and descriptions
- Technology stack and dependencies
- Key features and capabilities
- Relevant tags and categorization
- Repository metadata

### What's New in v0.1.0
- ✅ **GitHub MCP Integration**: Uses official remote GitHub MCP server via StreamableHTTP
- ✅ **No Docker Required**: Connects directly to hosted GitHub MCP service
- ✅ **Improved Maintainability**: Refactored from 400-line monolithic function to 7 focused functions
- ✅ **Better Reliability**: Official GitHub tools with built-in error handling
- ✅ **100% Backward Compatible**: No breaking changes to API

## Prerequisites

- Python 3.12+
- AWS Account with Bedrock access
- GitHub Personal Access Token
- uv package manager
- ~~Docker~~ **No Docker required!** (uses remote GitHub MCP server)

## Setup

1. **Install dependencies:**
   ```bash
   uv sync
   ```

2. **Configure AWS credentials:**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `AWS_REGION`: AWS region (e.g., us-east-1)
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `GITHUB_TOKEN`: GitHub personal access token

3. **Verify installation:**
   ```bash
   uv run python -c "import bedrock_agentcore; import strands; print('Setup successful!')"
   ```

## Development

The agent is implemented in `src/project_intelligence_agent.py` using:
- **bedrock-agentcore-starter-toolkit**: For AgentCore Runtime integration
- **strands-agents**: For agent framework and orchestration
- **strands-agents-tools**: Includes mcp_client for MCP integration
- **GitHub MCP Server**: Official remote GitHub MCP server via StreamableHTTP (no Docker!)

### Refactoring Documentation
For detailed information about the recent refactoring:
- [REFACTORING_README.md](REFACTORING_README.md) - Documentation index
- [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) - High-level overview
- [REFACTORING_NOTES.md](REFACTORING_NOTES.md) - Technical details
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

### Local Testing

**No Docker required!** The agent connects to the remote GitHub MCP server.

#### Quick Test
Run the test script to verify the refactored agent:

```bash
python test_refactored_agent.py
```

#### Manual Testing
Run the agent locally for interactive testing:

```bash
python main.py
```

The agent will start on `http://localhost:8080`. Test it with curl:

```bash
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"repository_url": "https://github.com/strands-agents/sdk-python"}'
```

## Deployment

Deploy the agent to Amazon Bedrock AgentCore Runtime using the `agentcore` CLI:

```bash
# Configure deployment
agentcore configure --entrypoint src/project_intelligence_agent.py --non-interactive

# Deploy to AWS
agentcore launch

# Test deployed agent
agentcore invoke '{"repository_url": "https://github.com/owner/repo"}'
```

The `agentcore launch` command automatically:
- Builds ARM64 Docker container
- Pushes to Amazon ECR
- Creates AgentCore Runtime resources
- Configures IAM roles and permissions
- Deploys the agent

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Project Intelligence Agent                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  strands-agents Framework                             │  │
│  │  - Agent orchestration                                │  │
│  │  - Tool management (mcp_client)                       │  │
│  │  - Bedrock Nova Micro integration                     │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Remote GitHub MCP Server (StreamableHTTP)            │  │
│  │  URL: https://api.githubcopilot.com/mcp/             │  │
│  │                                                        │  │
│  │  Tools Available:                                     │  │
│  │  - get_file_contents                                  │  │
│  │  - search_repositories                                │  │
│  │  - list_commits                                       │  │
│  │  - search_code                                        │  │
│  │  - And 100+ more GitHub tools                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture diagrams.

## Response Format

The agent returns structured JSON with analysis results:

```json
{
  "request_id": "uuid",
  "status": "completed",
  "analysis": {
    "summary": "2-3 sentence project description",
    "tech_stack": [
      {"name": "Python", "category": "language", "confidence": 0.95}
    ],
    "key_features": ["Feature 1", "Feature 2"],
    "tags": [
      {"name": "ai", "category": "domain", "confidence": 0.85}
    ],
    "metadata": {
      "repository_owner": "owner",
      "repository_name": "repo",
      "primary_language": "Python",
      "language_distribution": {"Python": 75.5},
      "star_count": 123,
      "fork_count": 45,
      "last_updated": "2025-10-17T10:00:00Z",
      "has_readme": true,
      "has_tests": false,
      "has_ci": false
    },
    "confidence_score": 0.92
  },
  "processing_time_ms": 12500
}
```

## Error Handling

The agent includes comprehensive error handling:
- Request validation
- GitHub API error handling
- Timeout protection (handled by AgentCore Runtime)
- Structured error responses with request IDs
- CloudWatch logging with context

## Monitoring

All operations are logged to CloudWatch with:
- Unique request IDs for tracking
- Processing duration metrics
- Error details with stack traces
- Analysis metadata (tech stack count, confidence scores)

## Next Steps

1. ✅ Agent implementation complete
2. Test locally with sample repositories
3. Deploy to AgentCore Runtime
4. Integrate with backend API
