---
inclusion: fileMatch
fileMatchPattern: "agents/**/*"
---

# HackaGallery Agents Development Guide

This steering document provides context, standards, and guidelines for developing AI agents for the HackaGallery platform. All agents in this workspace follow these principles and patterns.

## Project Context

**Project**: HackaGallery - AI-powered hackathon project showcase platform  
**Hackathon**: AWS AI Agent Global Hackathon 2025  
**Submission Deadline**: October 23, 2025 @ 8:00am GMT+8

### Mission

Transform how hackathon projects are discovered, showcased, and preserved by leveraging AWS AI agents to ensure every innovation gets the spotlight it deserves.

### Core Problem We're Solving

- Limited exposure for non-winning projects
- Short presentation windows that fail to capture project depth
- Project mortality after events conclude
- Fragmented hackathon participation records
- Discovery gap between builders and opportunities

## Architecture Standards

### Technology Stack

**Required Framework & Runtime**:

- **strands-agents** (Python) - Official agent framework
- **Amazon Bedrock AgentCore Runtime** - Deployment platform
- **Amazon Bedrock Nova models** - LLM for reasoning and decision-making
- **bedrock-agentcore-starter-toolkit** - AgentCore integration

**Python Version**: 3.12+

**Package Manager**: uv (preferred for speed and reliability)

### Agent Implementation Pattern

All agents MUST follow this structure:

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands_tools import mcp_client  # For MCP integrations

# Initialize BedrockAgentCoreApp at module level
app = BedrockAgentCoreApp()

@app.entrypoint
def agent_function(payload: dict) -> dict:
    """
    Main entrypoint for the agent.

    Args:
        payload: Input data from AgentCore Runtime

    Returns:
        Structured response dictionary
    """
    # Agent logic here
    pass

if __name__ == "__main__":
    app.run()
```

### File Organization

```
agents/
├── src/
│   ├── __init__.py
│   └── {agent_name}.py    # Agent implementation
├── scripts/
│   └── test_*.py          # Test scripts
├── docs/
│   └── *.md               # Documentation
├── main.py                # Entry point (imports from src/)
├── pyproject.toml         # Dependencies
├── .env.example           # Environment template
├── .bedrock_agentcore.yaml # AgentCore config
└── README.md              # Agent documentation
```

## Current Agents

### 1. Project Intelligence Agent (IMPLEMENTED ✅)

**Purpose**: Analyze GitHub repositories to extract technical details, generate summaries, and categorize projects.

**Location**: `src/project_intelligence_agent.py`

**Key Features**:

- Uses official GitHub MCP server (no Docker required)
- Connects via StreamableHTTP to `https://api.githubcopilot.com/mcp/`
- Extracts tech stack, features, tags, and metadata
- Returns structured JSON with confidence scores
- Comprehensive error handling and logging

**Response Format**:

```json
{
  "request_id": "uuid",
  "status": "completed",
  "analysis": {
    "summary": "2-3 sentence description",
    "tech_stack": [
      { "name": "Python", "category": "language", "confidence": 0.95 }
    ],
    "key_features": ["Feature 1", "Feature 2"],
    "tags": [{ "name": "ai", "category": "domain", "confidence": 0.85 }],
    "metadata": {
      "repository_owner": "owner",
      "repository_name": "repo",
      "primary_language": "Python",
      "star_count": 123,
      "has_readme": true,
      "has_tests": false
    },
    "confidence_score": 0.92
  },
  "processing_time_ms": 12500
}
```

### 2. Event Aggregation Agent (PLANNED)

**Purpose**: Monitor and import hackathon events from multiple platforms (Devpost, Hackathon.com, etc.)

**Planned Features**:

- Autonomous event discovery
- Data normalization across platforms
- Real-time sync
- Event verification

### 3. Matching & Recommendation Agent (PLANNED)

**Purpose**: Match projects with investor interests, recommend events, and suggest collaborations

**Planned Features**:

- User preference learning
- Project-investor matching
- Event recommendations
- Collaboration suggestions

## Development Standards

### Python Code Standards

Follow the [Zen of Python](https://peps.python.org/pep-0020/) principles for all code.

**Core Python Guidelines**:

- Python 3.12+ required (minimum supported version)
- Use `pyproject.toml` for project configuration (not `setup.py` or `requirements.txt`)
- Use `uv` for dependency management and package building
- Use `ruff` for linting and formatting
- Import all modules at the top of files (avoid mid-file imports unless necessary)

**Code Style**:

- Prefer `match ... case ...` over `if ... elif ... else ...` for branching logic
- Use f-strings for string formatting (not `str.format()`)
- Use `Path(...).open(...)` instead of `open(...)` for file operations
- Always specify `encoding="utf-8"` when opening text files (.txt, .json, etc.)
- Prefer `pathlib` over `os.path` for path operations
- Use `secrets` module for cryptographically strong random numbers (not `random`)
- Use `httpx` for HTTP requests (not `requests`)

**Type Hinting**:

- Use type hints everywhere possible
- Prefer `X | None` over `Optional[X]`
- Use built-in generics: `list[X]`, `tuple[X]`, `set[X]` (not `List[X]`, `Tuple[X]`, `Set[X]`)
- Example:
  ```python
  def analyze_project(payload: dict) -> dict:
      owner: str
      repo: str
      result: list[str] | None = None
  ```

**Docstrings**:

- Generate docstrings for all public modules, classes, functions, and methods
- Include purpose, args, returns, and raises sections
  ```python
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
  ```

**Error Handling**:

- Use comprehensive try-except blocks with specific exception types
- Log all errors with context (request_id, error_type, stack trace)
- Return structured error responses
- Never expose sensitive information in error messages

**Logging**:

- Use structured logging with CloudWatch-compatible format
  ```python
  logger.info(
      "Analysis completed",
      extra={
          "request_id": request_id,
          "duration_ms": duration_ms,
          "confidence_score": score
      }
  )
  ```

**External Knowledge**:

- Use available MCP server tools whenever you need external knowledge or APIs

### Function Design

**Principle**: Break complex logic into focused, single-responsibility functions

**Naming Convention**:

- Public functions: `analyze_project`, `discover_events`
- Private helpers: `_parse_github_url`, `_extract_json_from_response`
- Setup functions: `_setup_github_mcp_connection`

**Function Size**: Keep functions under 50 lines. If longer, refactor into smaller helpers.

### MCP Integration Pattern

When integrating with MCP servers:

1. **Connection Setup**:

   ```python
   agent.tool.mcp_client(
       action="connect",
       connection_id="service_name",
       transport="streamable_http",  # or "stdio" for local
       server_url="https://api.example.com/mcp/",
       headers={"Authorization": f"Bearer {token}"},
       timeout=60
   )
   ```

2. **Load Tools**:

   ```python
   agent.tool.mcp_client(action="load_tools", connection_id="service_name")
   ```

3. **Use in Prompts**: Let the agent discover and use tools naturally

   ```python
   prompt = f"""Use the available MCP tools to analyze {repo_url}.

   Available tools include get_file_contents, search_repositories, etc.
   """
   ```

### Secrets Management

**Production**: Use AWS Secrets Manager

```python
from boto3 import session
from botocore.exceptions import ClientError

def _get_secret(secret_name: str, region: str) -> str:
    boto_session = session.Session()
    client = boto_session.client(service_name="secretsmanager", region_name=region)
    response = client.get_secret_value(SecretId=secret_name)
    return response["SecretString"]
```

**Development**: Fall back to environment variables

```python
token = os.environ.get("GITHUB_TOKEN", "")
```

**Never**: Hardcode secrets or commit them to version control

### Response Format Standards

All agent responses MUST include:

- `request_id`: Unique UUID for tracking
- `status`: "completed", "failed", or "partial"
- `processing_time_ms`: Duration in milliseconds
- Main data in structured format (e.g., `analysis`, `events`, `matches`)

Error responses MUST include:

- `request_id`: Same UUID
- `error`: Human-readable error message
- `status`: "failed"

## Testing Standards

### Local Testing

1. **Environment Setup**:

   ```bash
   cp .env.example .env
   # Fill in credentials
   uv sync
   ```

2. **Run Agent Locally**:

   ```bash
   python main.py
   ```

3. **Test with curl**:
   ```bash
   curl -X POST http://localhost:8080/invocations \
     -H "Content-Type: application/json" \
     -d '{"repository_url": "https://github.com/owner/repo"}'
   ```

### Test Scripts

Create test scripts in `scripts/` directory:

- `test_{agent_name}.py` - Unit tests for agent functions
- `test_regression.py` - Regression tests for refactoring
- `test_agent_http.sh` - HTTP endpoint tests

### Deployment Testing

After deploying to AgentCore:

```bash
agentcore invoke '{"repository_url": "https://github.com/owner/repo"}'
```

## Deployment Standards

### Configuration File

`.bedrock_agentcore.yaml` structure:

```yaml
default_agent: main
agents:
  main:
    name: main
    entrypoint: main.py
    platform: linux/arm64
    container_runtime: none
    aws:
      region: us-west-2
      account: "YOUR_ACCOUNT_ID"
      execution_role: "arn:aws:iam::..."
    observability:
      enabled: true
    memory:
      mode: STM_ONLY
```

### Deployment Commands

```bash
# Configure (first time only)
agentcore configure --entrypoint src/project_intelligence_agent.py --non-interactive

# Deploy
agentcore launch

# Test
agentcore invoke '{"repository_url": "https://github.com/owner/repo"}'

# Monitor logs
# Check CloudWatch Logs in AWS Console
```

### Observability

**Always enable CloudWatch observability**:

- Set `observability.enabled: true` in config
- Use structured logging with `extra` fields
- Include request_id in all log entries
- Log processing duration and confidence scores

## AWS Services Integration

### Required Services

1. **Amazon Bedrock** - LLM models (Nova Micro, Nova Lite, Nova Pro)
2. **Amazon Bedrock AgentCore Runtime** - Agent deployment and scaling
3. **AWS Secrets Manager** - Secure credential storage
4. **Amazon CloudWatch** - Logging and monitoring
5. **Amazon ECR** - Container registry for agent images
6. **AWS IAM** - Roles and permissions

### IAM Permissions

Agents need permissions for:

- Bedrock model invocation
- Secrets Manager read access
- CloudWatch Logs write access
- S3 read/write (if storing artifacts)
- DynamoDB read/write (if using database)

## Common Patterns

### Request ID Tracking

Always generate and track request IDs:

```python
import uuid
from datetime import datetime, timezone

request_id = str(uuid.uuid4())
start_time = datetime.now(timezone.utc)

logger.info("Request started", extra={"request_id": request_id})
```

### Duration Calculation

```python
end_time = datetime.now(timezone.utc)
duration_ms = int((end_time - start_time).total_seconds() * 1000)
```

### JSON Extraction from LLM Responses

LLMs may return JSON in various formats:

- Direct JSON object
- Markdown code blocks
- Mixed text and JSON

Use robust extraction:

````python
def _extract_json_from_response(raw_message: Any) -> dict[str, Any]:
    # Handle dict responses
    if isinstance(raw_message, dict):
        return raw_message

    # Handle string responses
    if isinstance(raw_message, str):
        # Try markdown code blocks
        json_match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))

        # Try brace counting
        # ... implementation
````

### Fallback Responses

Always provide fallback when parsing fails:

```python
try:
    data = _extract_json_from_response(result.message)
except json.JSONDecodeError:
    data = _create_fallback_response(owner, repo, str(result.message))
    logger.warning("Using fallback response", extra={"request_id": request_id})
```

## Documentation Standards

### README.md Structure

Every agent must have:

1. Overview - What the agent does
2. Prerequisites - Required tools and credentials
3. Setup - Installation and configuration
4. Development - Local testing instructions
5. Deployment - AgentCore deployment steps
6. Architecture - System design and data flow
7. Response Format - Expected output structure
8. Error Handling - Common errors and solutions
9. Monitoring - CloudWatch and observability

### Code Comments

- Explain WHY, not WHAT
- Document non-obvious decisions
- Reference AWS documentation for official patterns
- Include links to relevant resources

### Architecture Diagrams

Use ASCII art or Mermaid for diagrams:

```
┌─────────────────────────────────────┐
│  Project Intelligence Agent         │
│  ┌───────────────────────────────┐  │
│  │  strands-agents Framework     │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  GitHub MCP Server            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Performance Guidelines

### Response Time Targets

- Simple analysis: < 15 seconds
- Complex analysis: < 30 seconds
- Batch operations: < 60 seconds per item

### Optimization Strategies

1. **Parallel Processing**: Use async/await for concurrent operations
2. **Caching**: Cache frequently accessed data (repository metadata)
3. **Selective Analysis**: Only fetch necessary files/data
4. **Timeout Management**: Set appropriate timeouts for external APIs
5. **Model Selection**: Use Nova Micro for simple tasks, Nova Pro for complex reasoning

### Resource Limits

- Memory: 2GB default (configurable in AgentCore)
- Timeout: 60 seconds default (configurable)
- Concurrent requests: Handled by AgentCore auto-scaling

## Security Best Practices

1. **Input Validation**: Always validate and sanitize user inputs
2. **Secret Rotation**: Rotate API tokens regularly
3. **Least Privilege**: Request minimum necessary IAM permissions
4. **Audit Logging**: Log all security-relevant events
5. **Error Messages**: Never expose internal details or credentials
6. **Rate Limiting**: Respect external API rate limits
7. **HTTPS Only**: Use encrypted connections for all external calls

## Troubleshooting Guide

### Common Issues

**Issue**: "GitHub token not found"

- **Solution**: Set `GITHUB_TOKEN` in `.env` or configure Secrets Manager

**Issue**: "Failed to connect to GitHub MCP server"

- **Solution**: Check network connectivity, verify token validity, check MCP server status

**Issue**: "Agent invocation timeout"

- **Solution**: Increase timeout in AgentCore config, optimize agent logic

**Issue**: "JSON parsing failed"

- **Solution**: Check LLM prompt clarity, use fallback response pattern

### Debugging

1. **Local Testing**: Run agent locally with `python main.py`
2. **Verbose Logging**: Set `logging.DEBUG` for detailed logs
3. **CloudWatch Logs**: Check logs in AWS Console after deployment
4. **Request Tracing**: Use request_id to trace execution flow

## Future Enhancements

### Planned Features

1. **Multi-Repository Analysis**: Analyze multiple repos in parallel
2. **Incremental Updates**: Update analysis when repo changes
3. **Custom Prompts**: Allow users to customize analysis focus
4. **Webhook Integration**: Trigger analysis on repo events
5. **Batch Processing**: Analyze entire hackathon submissions at once

### Scalability Considerations

- Use AgentCore auto-scaling for high traffic
- Implement caching layer (Redis/ElastiCache)
- Consider SQS for async processing
- Use Step Functions for complex workflows

## References

### Official Documentation

- [Amazon Bedrock AgentCore](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-agentcore.html)
- [strands-agents Framework](https://github.com/strands-agents/sdk-python)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)

### Internal Documentation

- [PRD.md](../../PRD.md) - Product requirements
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment guide
- [REFACTORING_SUMMARY.md](docs/REFACTORING_SUMMARY.md) - Recent refactoring

## Questions or Issues?

For questions about agent development:

1. Check existing documentation in `docs/`
2. Review test scripts in `scripts/`
3. Examine the Project Intelligence Agent implementation
4. Consult AWS documentation for service-specific questions

---

**Last Updated**: October 24, 2025  
**Version**: 1.0.0  
**Maintainer**: HackaGallery Team
