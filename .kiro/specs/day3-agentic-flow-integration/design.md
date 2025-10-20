# Design Document: Day 3 Agentic Flow Integration

## Overview

This design document outlines the architecture and implementation approach for integrating the Project Intelligence Agent into HackaGallery using the strands-agents framework and Amazon Bedrock AgentCore Runtime. The integration enables automated analysis of GitHub repositories to generate AI-enhanced project descriptions, extract technical metadata, and categorize projects intelligently.

The design follows a three-tier architecture:
1. **Frontend Layer**: Next.js application with React components for user interaction
2. **Backend Layer**: Python FastAPI service that orchestrates agent invocations
3. **Agent Layer**: strands-agents based Project Intelligence Agent deployed on Bedrock AgentCore Runtime

This implementation represents the core differentiator for HackaGallery, demonstrating autonomous AI capabilities that transform raw repository data into rich, discoverable project showcases.

**Design Philosophy:**

This design leverages AgentCore best practices:
- **Simplified Tool Architecture**: Uses built-in `http_request` tool instead of custom tools, relying on agent reasoning for analysis
- **CLI-Driven Deployment**: Uses `agentcore` CLI for automated container building and deployment
- **Agent-Centric Logic**: Moves parsing and analysis logic into agent prompts rather than separate tools
- **Minimal Custom Code**: Reduces maintenance burden by using framework capabilities

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌──────────────────┐         ┌─────────────────────────────┐  │
│  │  Project Submit  │────────▶│  Analysis Status Display    │  │
│  │  Form Component  │         │  (Loading/Results/Error)    │  │
│  └──────────────────┘         └─────────────────────────────┘  │
│           │                                  ▲                   │
│           │ POST /api/projects/analyze      │                   │
│           ▼                                  │                   │
└───────────────────────────────────────────────────────────────┘
            │                                  │
            │                                  │
┌───────────▼──────────────────────────────────┴─────────────────┐
│                   Backend API (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Route Handler                           │  │
│  │  - Validate GitHub URL                                   │  │
│  │  - Generate Request ID                                   │  │
│  │  - Invoke AgentCore Runtime                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │                                  ▲                   │
│           │ InvokeAgent API                  │ Analysis Result   │
│           ▼                                  │                   │
└───────────────────────────────────────────────────────────────┘
            │                                  │
            │                                  │
┌───────────▼──────────────────────────────────┴─────────────────┐
│            Amazon Bedrock AgentCore Runtime                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Project Intelligence Agent (strands-agents)      │  │
│  │  ┌────────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │ GitHub API     │  │ README       │  │ Tech Stack  │  │  │
│  │  │ Fetcher Tool   │  │ Parser Tool  │  │ Analyzer    │  │  │
│  │  └────────────────┘  └──────────────┘  └─────────────┘  │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Amazon Bedrock (Nova Micro/Lite)                  │ │  │
│  │  │  - Reasoning & Decision Making                     │ │  │
│  │  │  - Content Generation                              │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            │                                  │
            │ GitHub API                       │
            ▼                                  │
┌───────────────────────────────────────────────────────────────┐
│                    External Services                            │
│  ┌──────────────────┐         ┌─────────────────────────────┐  │
│  │   GitHub API     │         │   Amazon CloudWatch Logs    │  │
│  │   (REST API)     │         │   (Monitoring & Logging)    │  │
│  └──────────────────┘         └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. User submits GitHub repository URL via frontend form
2. Frontend sends POST request to `/api/projects/analyze` with repository URL
3. Backend validates URL format and GitHub accessibility
4. Backend invokes Project Intelligence Agent via Bedrock AgentCore Runtime API
5. Agent fetches repository metadata from GitHub API
6. Agent analyzes README, code files, and dependencies
7. Agent uses Bedrock Nova model to generate summary and extract insights
8. Agent returns structured analysis result to backend
9. Backend transforms and returns result to frontend
10. Frontend displays analysis in preview card with tags and summary

### Technology Stack

**Frontend:**
- Next.js 15.5.5 (App Router)
- React 19.1.0
- TypeScript 5.x
- TailwindCSS 4.x
- Existing service layer pattern (projectService.ts)

**Backend:**
- Python 3.12+
- FastAPI 0.115+
- strands-agents framework
- bedrock-agentcore Python SDK
- boto3 (AWS SDK for Python)
- pydantic for data validation
- uv for dependency management
- ruff for linting and formatting

**Agent Runtime:**
- Amazon Bedrock AgentCore Runtime
- Docker container (ARM64 architecture)
- Amazon ECR for container registry
- Amazon Bedrock Nova Micro/Lite models

**Infrastructure:**
- AWS Lambda (optional for API Gateway integration)
- Amazon CloudWatch Logs
- Amazon ECR
- GitHub API (external)

## Components and Interfaces

### 1. Frontend Components

#### ProjectAnalysisForm Component

**Location:** `frontend/src/components/features/projects/ProjectAnalysisForm.tsx`

**Purpose:** Provides UI for users to submit GitHub repository URLs for AI analysis

**Props:**
```typescript
interface ProjectAnalysisFormProps {
  onAnalysisComplete: (analysis: ProjectAnalysis) => void;
  onError: (error: string) => void;
  initialUrl?: string;
}
```

**State:**
```typescript
interface FormState {
  repositoryUrl: string;
  isAnalyzing: boolean;
  progress: AnalysisProgress | null;
  error: string | null;
}

interface AnalysisProgress {
  stage: 'validating' | 'fetching' | 'analyzing' | 'generating';
  message: string;
  percentage: number;
}
```

**Key Methods:**
- `handleSubmit()`: Validates URL and triggers analysis
- `pollAnalysisStatus()`: Polls backend for progress updates
- `handleAnalysisComplete()`: Processes successful analysis result
- `handleAnalysisError()`: Displays error messages with retry option

#### ProjectAnalysisPreview Component

**Location:** `frontend/src/components/features/projects/ProjectAnalysisPreview.tsx`

**Purpose:** Displays AI-generated analysis results in a user-friendly format

**Props:**
```typescript
interface ProjectAnalysisPreviewProps {
  analysis: ProjectAnalysis;
  onConfirm: () => void;
  onEdit: (field: keyof ProjectAnalysis, value: string) => void;
  onReanalyze: () => void;
}
```

**Features:**
- Editable project summary with inline editing
- Technology tags with color-coded categories
- Key features list with bullet points
- Confidence scores for extracted metadata
- Action buttons: Confirm, Edit, Re-analyze

### 2. Backend API Service

#### FastAPI Application Structure

**Location:** `backend/app/main.py`

**Endpoints:**

```python
@app.post("/api/projects/analyze")
async def analyze_project(request: AnalyzeProjectRequest) -> AnalysisResponse:
    """
    Analyzes a GitHub repository using the Project Intelligence Agent
    
    Request Body:
    {
        "repository_url": "https://github.com/user/repo",
        "options": {
            "include_code_analysis": true,
            "max_files_to_scan": 50
        }
    }
    
    Response:
    {
        "request_id": "req_abc123",
        "status": "completed",
        "analysis": {
            "summary": "...",
            "tech_stack": [...],
            "key_features": [...],
            "tags": [...],
            "confidence_score": 0.92
        }
    }
    """
    pass

@app.get("/api/projects/analyze/{request_id}/status")
async def get_analysis_status(request_id: str) -> StatusResponse:
    """
    Retrieves the status of an ongoing analysis
    
    Response:
    {
        "request_id": "req_abc123",
        "status": "in_progress",
        "progress": {
            "stage": "analyzing",
            "percentage": 65,
            "message": "Analyzing code structure..."
        }
    }
    """
    pass
```

#### AgentCore Client Service

**Location:** `backend/app/services/agentcore_client.py`

**Purpose:** Manages communication with Bedrock AgentCore Runtime

**Key Methods:**

```python
class AgentCoreClient:
    def __init__(self, agent_id: str, agent_alias_id: str):
        self.bedrock_agent_runtime = boto3.client('bedrock-agent-runtime')
        self.agent_id = agent_id
        self.agent_alias_id = agent_alias_id
    
    async def invoke_agent(
        self, 
        payload: Dict[str, Any],
        session_id: Optional[str] = None
    ) -> AgentResponse:
        """
        Invokes the Project Intelligence Agent with the given payload
        
        Uses InvokeAgent API with streaming response handling
        """
        pass
    
    async def invoke_agent_with_retry(
        self,
        payload: Dict[str, Any],
        max_retries: int = 3
    ) -> AgentResponse:
        """
        Invokes agent with exponential backoff retry logic
        """
        pass
```

#### GitHub Validation Service

**Location:** `backend/app/services/github_validator.py`

**Purpose:** Validates GitHub URLs and checks repository accessibility

**Key Methods:**

```python
class GitHubValidator:
    def validate_url(self, url: str) -> ValidationResult:
        """
        Validates GitHub URL format and extracts owner/repo
        
        Returns:
            ValidationResult with is_valid, owner, repo, error_message
        """
        pass
    
    async def check_repository_exists(
        self, 
        owner: str, 
        repo: str
    ) -> bool:
        """
        Checks if repository exists and is accessible via GitHub API
        """
        pass
    
    def is_rate_limited(self) -> Tuple[bool, Optional[datetime]]:
        """
        Checks GitHub API rate limit status
        
        Returns:
            (is_limited, reset_time)
        """
        pass
```

### 3. Project Intelligence Agent

#### Agent Implementation

**Location:** `agent/project_intelligence_agent.py`

**Framework:** strands-agents

**Structure:**

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands_tools import http_request
import os

app = BedrockAgentCoreApp()

# Initialize agent with Bedrock Nova Micro model
# Note: Model ID format for Bedrock is just the model ID, not "bedrock/" prefix
project_agent = Agent(
    model="us.amazon.nova-micro-v1:0",  # Correct format for Bedrock models
    tools=[http_request],
    temperature=0.3,  # Lower temperature for more consistent analysis
)

@app.entrypoint
def analyze_project(payload: dict) -> dict:
    """
    Main entrypoint for project analysis.
    
    Payload:
    {
        "repository_url": "https://github.com/user/repo",
        "options": {
            "include_code_analysis": true,
            "max_files_to_scan": 50
        }
    }
    
    Returns:
    {
        "summary": "AI-generated project summary",
        "tech_stack": [{"name": "Python", "category": "language", "confidence": 0.95}],
        "key_features": ["Feature 1", "Feature 2"],
        "tags": [{"name": "ai", "category": "domain", "confidence": 0.85}],
        "confidence_score": 0.92,
        "metadata": {...}
    }
    """
    repo_url = payload.get("repository_url")
    github_token = os.environ.get("GITHUB_TOKEN")
    
    # Construct detailed prompt for the agent
    prompt = f"""Analyze the GitHub repository at {repo_url}.

Use the http_request tool to fetch data from GitHub API with these endpoints:
1. GET https://api.github.com/repos/{{owner}}/{{repo}} - Repository metadata
2. GET https://api.github.com/repos/{{owner}}/{{repo}}/languages - Language distribution
3. GET https://api.github.com/repos/{{owner}}/{{repo}}/readme - README content

For authentication, use:
- auth_type: "Bearer"
- auth_token: "{github_token}"

Extract and return a JSON object with:
{{
  "summary": "2-3 sentence project description",
  "tech_stack": [
    {{"name": "Python", "category": "language", "confidence": 0.95}},
    {{"name": "FastAPI", "category": "framework", "confidence": 0.90}}
  ],
  "key_features": ["Feature 1", "Feature 2", "Feature 3"],
  "tags": [
    {{"name": "ai", "category": "domain", "confidence": 0.85}},
    {{"name": "web-app", "category": "platform", "confidence": 0.90}}
  ],
  "metadata": {{
    "repository_owner": "owner",
    "repository_name": "repo",
    "primary_language": "Python",
    "language_distribution": {{"Python": 75.5, "JavaScript": 24.5}},
    "star_count": 123,
    "fork_count": 45,
    "last_updated": "2025-10-17T10:00:00Z",
    "has_readme": true,
    "has_tests": true,
    "has_ci": false
  }},
  "confidence_score": 0.92
}}

Focus on accuracy and provide realistic confidence scores based on the data available.
"""
    
    # Invoke agent synchronously (AgentCore Runtime handles this)
    result = project_agent(prompt)
    
    # Extract the response message
    return {"analysis": result.message}

if __name__ == "__main__":
    app.run()
```

#### Agent Tools

The agent uses the built-in `http_request` tool from `strands-agents-tools` for GitHub API interactions. The agent's reasoning capabilities (via Bedrock Nova) handle the analysis logic, eliminating the need for separate custom tools.

**Tool Usage Pattern:**

```python
from strands import Agent
from strands_tools import http_request

agent = Agent(
    model="bedrock/us.amazon.nova-micro-v1:0",
    tools=[http_request]
)

# Agent uses http_request tool to fetch GitHub data
# and its reasoning to analyze and structure the response
result = await agent.run_async("""
Analyze the GitHub repository at {repo_url}.

Steps:
1. Fetch repository metadata from GitHub API
2. Fetch README content
3. Identify languages and dependencies
4. Extract key features from README
5. Generate a 2-3 sentence summary
6. Suggest relevant tags

Return structured JSON with:
- summary (string)
- tech_stack (array of {name, category, confidence})
- key_features (array of strings)
- tags (array of {name, category, confidence})
- metadata (object with repo details)
""")
```

**Why No Custom Tools:**

1. **Built-in HTTP Tool:** The `http_request` tool from strands-agents-tools handles all GitHub API calls with authentication support
2. **Agent Reasoning:** Bedrock Nova models have strong reasoning capabilities to parse JSON responses, extract information, and structure outputs
3. **Simplified Architecture:** Fewer custom tools means less code to maintain and debug
4. **Faster Development:** Leveraging agent reasoning reduces implementation time

**GitHub API Interactions:**

The agent will use `http_request` to call:
- `GET https://api.github.com/repos/{owner}/{repo}` - Repository metadata
- `GET https://api.github.com/repos/{owner}/{repo}/languages` - Language distribution
- `GET https://api.github.com/repos/{owner}/{repo}/readme` - README content
- `GET https://api.github.com/repos/{owner}/{repo}/contents/{path}` - File contents (package.json, requirements.txt)

**Authentication:**

```python
# Pass GitHub token via environment variable
response = agent.tool.http_request(
    method="GET",
    url="https://api.github.com/repos/user/repo",
    auth_type="Bearer",
    auth_token=os.environ.get("GITHUB_TOKEN")
)
```

## Data Models

### Frontend Data Models

**Location:** `frontend/src/lib/types/analysis.ts`

```typescript
export interface ProjectAnalysis {
  requestId: string;
  repositoryUrl: string;
  summary: string;
  techStack: TechnologyItem[];
  keyFeatures: string[];
  tags: TagItem[];
  confidenceScore: number;
  metadata: AnalysisMetadata;
  createdAt: string;
}

export interface TechnologyItem {
  name: string;
  category: 'language' | 'framework' | 'library' | 'tool' | 'aws-service';
  confidence: number;
  version?: string;
}

export interface TagItem {
  name: string;
  category: 'domain' | 'technology' | 'feature' | 'platform';
  confidence: number;
}

export interface AnalysisMetadata {
  repositoryOwner: string;
  repositoryName: string;
  primaryLanguage: string;
  languageDistribution: Record<string, number>;
  starCount: number;
  forkCount: number;
  lastUpdated: string;
  hasReadme: boolean;
  hasTests: boolean;
  hasCI: boolean;
}

export interface AnalyzeProjectRequest {
  repositoryUrl: string;
  options?: AnalysisOptions;
}

export interface AnalysisOptions {
  includeCodeAnalysis?: boolean;
  maxFilesToScan?: number;
  skipCache?: boolean;
}

export interface AnalysisResponse {
  requestId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  analysis?: ProjectAnalysis;
  error?: string;
  progress?: AnalysisProgress;
}

export interface AnalysisProgress {
  stage: 'validating' | 'fetching' | 'analyzing' | 'generating';
  message: string;
  percentage: number;
  estimatedTimeRemaining?: number;
}
```

### Backend Data Models

**Location:** `backend/app/models/analysis.py`

```python
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Dict, Optional, Literal
from datetime import datetime

class AnalyzeProjectRequest(BaseModel):
    repository_url: HttpUrl
    options: Optional['AnalysisOptions'] = None

class AnalysisOptions(BaseModel):
    include_code_analysis: bool = True
    max_files_to_scan: int = 50
    skip_cache: bool = False

class TechnologyItem(BaseModel):
    name: str
    category: Literal['language', 'framework', 'library', 'tool', 'aws-service']
    confidence: float = Field(ge=0.0, le=1.0)
    version: Optional[str] = None

class TagItem(BaseModel):
    name: str
    category: Literal['domain', 'technology', 'feature', 'platform']
    confidence: float = Field(ge=0.0, le=1.0)

class AnalysisMetadata(BaseModel):
    repository_owner: str
    repository_name: str
    primary_language: str
    language_distribution: Dict[str, float]
    star_count: int
    fork_count: int
    last_updated: datetime
    has_readme: bool
    has_tests: bool
    has_ci: bool

class ProjectAnalysis(BaseModel):
    request_id: str
    repository_url: str
    summary: str
    tech_stack: List[TechnologyItem]
    key_features: List[str]
    tags: List[TagItem]
    confidence_score: float = Field(ge=0.0, le=1.0)
    metadata: AnalysisMetadata
    created_at: datetime

class AnalysisProgress(BaseModel):
    stage: Literal['validating', 'fetching', 'analyzing', 'generating']
    message: str
    percentage: int = Field(ge=0, le=100)
    estimated_time_remaining: Optional[int] = None

class AnalysisResponse(BaseModel):
    request_id: str
    status: Literal['pending', 'in_progress', 'completed', 'failed']
    analysis: Optional[ProjectAnalysis] = None
    error: Optional[str] = None
    progress: Optional[AnalysisProgress] = None
```

### Agent Data Models

**Location:** `agent/src/models/agent_payload.py`

```python
from typing import TypedDict, Optional, List

class AgentPayload(TypedDict):
    repository_url: str
    options: 'PayloadOptions'

class PayloadOptions(TypedDict, total=False):
    include_code_analysis: bool
    max_files_to_scan: int

class AgentResponse(TypedDict):
    summary: str
    tech_stack: List['TechStackItem']
    key_features: List[str]
    tags: List['TagData']
    confidence_score: float
    metadata: 'ResponseMetadata'

class TechStackItem(TypedDict):
    name: str
    category: str
    confidence: float
    version: Optional[str]

class TagData(TypedDict):
    name: str
    category: str
    confidence: float

class ResponseMetadata(TypedDict):
    repository_owner: str
    repository_name: str
    primary_language: str
    language_distribution: dict
    star_count: int
    fork_count: int
    last_updated: str
    has_readme: bool
    has_tests: bool
    has_ci: bool
```

## Error Handling

### Error Categories

1. **Validation Errors (400)**
   - Invalid GitHub URL format
   - Repository not found
   - Private repository without access
   - Malformed request payload

2. **Rate Limit Errors (429)**
   - GitHub API rate limit exceeded
   - AgentCore invocation quota exceeded

3. **Service Errors (503)**
   - AgentCore Runtime unavailable
   - GitHub API timeout
   - Agent execution timeout (>30s)

4. **Internal Errors (500)**
   - Unexpected agent failures
   - Database connection errors
   - Unhandled exceptions

### Error Response Format

```typescript
interface ErrorResponse {
  requestId: string;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    retryable: boolean;
    retryAfter?: number; // seconds
  };
  timestamp: string;
}
```

### Error Handling Strategy

**Frontend:**
- Display user-friendly error messages
- Provide retry button for retryable errors
- Show rate limit countdown for 429 errors
- Log errors to browser console for debugging

**Backend:**
- Implement exponential backoff for retryable errors
- Cache successful analyses to reduce API calls
- Log all errors to CloudWatch with context
- Return structured error responses with request IDs

**Agent:**
- Gracefully handle GitHub API failures
- Return partial results when possible
- Implement timeout protection (25s max)
- Log tool execution failures

## Testing Strategy

### Unit Tests

**Frontend Tests:**
- Component rendering with different states
- Form validation logic
- API client error handling
- Data transformation utilities

**Backend Tests:**
- Request validation
- GitHub URL parsing
- AgentCore client mocking
- Error response formatting

**Agent Tests:**
- Tool function correctness
- README parsing accuracy
- Tech stack detection logic
- Content generation quality

### Integration Tests

**End-to-End Flow:**
1. Submit valid GitHub URL
2. Verify agent invocation
3. Check analysis result structure
4. Validate frontend display

**Error Scenarios:**
1. Invalid URL handling
2. Rate limit response
3. Timeout behavior
4. Partial failure recovery

### Performance Tests

**Metrics to Measure:**
- Analysis completion time (target: <15s)
- GitHub API response time
- Agent execution time
- Frontend rendering time

**Load Testing:**
- Concurrent analysis requests
- Rate limit handling under load
- Cache effectiveness

### Manual Testing Checklist

- [ ] Submit public repository URL
- [ ] Submit private repository URL (should fail gracefully)
- [ ] Submit invalid URL format
- [ ] Test with repositories of different sizes
- [ ] Test with repositories in different languages
- [ ] Verify tag categorization accuracy
- [ ] Check summary quality and relevance
- [ ] Test retry functionality
- [ ] Verify progress updates
- [ ] Test edit functionality in preview

## Universal Deployment Strategy

### Platform-Agnostic Architecture

The design separates concerns to enable deployment flexibility:

1. **Frontend**: Platform-agnostic Next.js app (Vercel, Netlify, AWS Amplify)
2. **Backend API**: Serverless functions (AWS Lambda, Vercel, Netlify)
3. **Agent Runtime**: AWS-hosted (Bedrock AgentCore)

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Vercel/Netlify/Amplify)                          │
│  - Next.js static/SSR pages                                 │
│  - Client-side API calls                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend API (Vercel Functions/Netlify Functions/Lambda)    │
│  - Serverless function endpoints                            │
│  - AWS SDK for AgentCore invocation                         │
└──────────────────┬──────────────────────────────────────────┘
                   │ AWS SDK (boto3)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent Runtime (AWS Bedrock AgentCore)                      │
│  - Hosted on AWS (region-specific)                          │
│  - Invoked via AWS API                                      │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Options

#### Option 1: Vercel (Recommended for Hackathon)

**Frontend:**
```bash
# Deploy Next.js to Vercel
vercel deploy --prod
```

**Backend API:**
```python
# api/analyze.py (Vercel Serverless Function)
from http.server import BaseHTTPRequestHandler
import json
import boto3
import os

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = json.loads(self.rfile.read(content_length))
        
        # Invoke AgentCore Runtime
        client = boto3.client('bedrock-agentcore', region_name='us-east-1')
        response = client.invoke_agent_runtime(
            agentRuntimeArn=os.environ['AGENT_RUNTIME_ARN'],
            runtimeSessionId=body.get('session_id'),
            payload=json.dumps(body).encode()
        )
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
```

**Environment Variables (Vercel):**
```bash
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add AWS_REGION
vercel env add AGENT_RUNTIME_ARN
vercel env add GITHUB_TOKEN
```

#### Option 2: Netlify

**Frontend:**
```bash
# Deploy Next.js to Netlify
netlify deploy --prod
```

**Backend API:**
```python
# netlify/functions/analyze.py
import json
import boto3
import os

def handler(event, context):
    body = json.loads(event['body'])
    
    # Invoke AgentCore Runtime
    client = boto3.client('bedrock-agentcore', region_name='us-east-1')
    response = client.invoke_agent_runtime(
        agentRuntimeArn=os.environ['AGENT_RUNTIME_ARN'],
        runtimeSessionId=body.get('session_id'),
        payload=json.dumps(body).encode()
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }
```

**Environment Variables (Netlify):**
```toml
# netlify.toml
[build.environment]
  AWS_ACCESS_KEY_ID = ""
  AWS_SECRET_ACCESS_KEY = ""
  AWS_REGION = "us-east-1"
  AGENT_RUNTIME_ARN = ""
  GITHUB_TOKEN = ""
```

#### Option 3: AWS Amplify (Full AWS Stack)

**Frontend + Backend:**
```bash
# Deploy everything to AWS
amplify publish
```

**Backend API (AWS Lambda):**
```python
# amplify/backend/function/analyzeProject/src/index.py
import json
import boto3
import os

def handler(event, context):
    body = json.loads(event['body'])
    
    # Invoke AgentCore Runtime (same region, optimized latency)
    client = boto3.client('bedrock-agentcore')
    response = client.invoke_agent_runtime(
        agentRuntimeArn=os.environ['AGENT_RUNTIME_ARN'],
        runtimeSessionId=body.get('session_id'),
        payload=json.dumps(body).encode()
    )
    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(response)
    }
```

### AWS Credentials Management

**For Vercel/Netlify:**
- Use IAM user credentials with minimal permissions
- Store as environment variables
- Required permissions: `bedrock-agentcore:InvokeAgentRuntime`

**For AWS Amplify:**
- Use IAM roles (no credentials needed)
- Automatic integration with AgentCore
- Better security posture

### Cross-Platform Considerations

1. **API Endpoint Configuration:**
   ```typescript
   // frontend/src/lib/config/api.ts
   export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api` : 
      'http://localhost:3000/api');
   ```

2. **CORS Configuration:**
   - Vercel/Netlify: Configure in function headers
   - AWS: Configure in API Gateway or Lambda response

3. **Cold Start Optimization:**
   - All platforms: Keep functions warm with periodic pings
   - AgentCore: Handles agent warm-up automatically

4. **Cost Optimization:**
   - Vercel/Netlify: Free tier for hobby projects
   - AWS: Pay-per-use for Lambda + AgentCore
   - AgentCore: Only charged when agents are invoked

### Recommended Setup for Hackathon

**Day 3 (MVP):**
- Frontend: Vercel (fastest deployment, great DX)
- Backend: Vercel Serverless Functions (same platform, simple)
- Agent: AWS Bedrock AgentCore (required for AI capabilities)

**Post-Hackathon:**
- Consider AWS Amplify for full AWS integration
- Or keep Vercel/Netlify for frontend + AWS for backend/agents

This architecture ensures the app works regardless of where the frontend is hosted, as long as the backend can make AWS SDK calls to AgentCore.

## Deployment Architecture

### Container Build Process

The AgentCore CLI (`agentcore launch`) automatically handles container building. No manual Dockerfile is needed. The CLI:

1. Detects Python version and dependencies from requirements.txt
2. Builds an ARM64-compatible container
3. Includes the bedrock_agentcore.runtime entrypoint
4. Pushes to Amazon ECR
5. Deploys to AgentCore Runtime

**Manual Dockerfile (if needed for customization):**

```dockerfile
# agent/Dockerfile
FROM public.ecr.aws/docker/library/python:3.12-slim-bookworm

# Install dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY project_intelligence_agent.py .

# Set entrypoint for AgentCore Runtime
CMD ["python", "-m", "bedrock_agentcore.runtime"]
```

However, using `agentcore launch` is recommended as it handles all deployment complexities automatically.

### Deployment Steps

**Prerequisites:**
- Python 3.10+ with virtual environment
- AWS credentials configured
- AgentCore CLI installed: `pip install bedrock-agentcore-starter-toolkit`

**Step 1: Create Agent Code**

Create the agent with strands-agents framework and wrap with BedrockAgentCoreApp:

```python
# agent/project_intelligence_agent.py
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands_tools import http_request

app = BedrockAgentCoreApp()

# Initialize agent with Bedrock Nova model
project_agent = Agent(
    model="bedrock/us.amazon.nova-micro-v1:0",
    tools=[http_request]  # For GitHub API calls
)

@app.entrypoint
async def analyze_project(payload: dict) -> dict:
    """Analyzes GitHub repository and returns structured insights"""
    repo_url = payload.get("repository_url")
    result = await project_agent.run_async(
        f"Analyze the GitHub repository at {repo_url}..."
    )
    return result.data

if __name__ == "__main__":
    app.run()
```

**Step 2: Create pyproject.toml**

```toml
[project]
name = "project-intelligence-agent"
version = "0.1.0"
description = "AI agent for analyzing GitHub repositories"
requires-python = ">=3.12"
dependencies = [
    "bedrock-agentcore-starter-toolkit>=1.0.0",
    "strands-agents>=1.0.0",
    "strands-agents-tools>=0.2.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

**Development Setup with uv:**

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create project
mkdir agent && cd agent
uv init --python 3.12
uv add bedrock-agentcore-starter-toolkit strands-agents strands-agents-tools
```

**Step 3: Test Locally (Optional)**

```bash
# Start agent locally
python project_intelligence_agent.py

# Test in another terminal
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"repository_url": "https://github.com/user/repo"}'
```

**Step 4: Deploy to AgentCore**

```bash
# Configure deployment
agentcore configure --entrypoint project_intelligence_agent.py --non-interactive

# Deploy to AWS (automatically builds container, pushes to ECR, creates resources)
agentcore launch

# Test deployed agent
agentcore invoke '{"repository_url": "https://github.com/user/repo"}'
```

The `agentcore launch` command automatically:
- Builds ARM64 Docker container
- Pushes to Amazon ECR
- Creates AgentCore Runtime resources
- Configures IAM roles and permissions
- Deploys the agent

**Step 5: Deploy Backend API**

- Package FastAPI application
- Deploy to AWS Lambda or EC2
- Configure environment variables (agent ID from launch output)
- Set up API Gateway

**Step 6: Deploy Frontend**

```bash
cd frontend
npm run build
aws amplify publish
```

### Environment Variables

**Backend (.env):**
```bash
AWS_REGION=us-east-1
AGENT_RUNTIME_ARN=<agent-runtime-arn>  # From agentcore launch output
GITHUB_TOKEN=<github-pat>
CACHE_TTL_SECONDS=3600
MAX_ANALYSIS_TIMEOUT=30
LOG_LEVEL=INFO
```

**Agent (set during deployment):**
```bash
# Set environment variables during launch
agentcore launch --env GITHUB_TOKEN=<github-pat>

# Or configure in agentcore.yaml
environment:
  GITHUB_TOKEN: <github-pat>
  AWS_REGION: us-east-1
```

## Monitoring and Observability

### CloudWatch Metrics

**Custom Metrics:**
- `AnalysisRequestCount`: Total analysis requests
- `AnalysisSuccessRate`: Percentage of successful analyses
- `AnalysisLatency`: Time to complete analysis
- `GitHubAPICallCount`: Number of GitHub API calls
- `AgentInvocationCount`: Number of agent invocations
- `CacheHitRate`: Percentage of cached results served

### CloudWatch Logs

**Log Groups:**
- `/aws/lambda/hackagallery-backend-api`: Backend API logs
- `/aws/bedrock/agentcore/project-intelligence-agent`: Agent execution logs

**Log Format:**
```json
{
  "timestamp": "2025-10-17T10:30:00Z",
  "request_id": "req_abc123",
  "level": "INFO",
  "component": "agent",
  "message": "Analysis completed successfully",
  "metadata": {
    "repository": "user/repo",
    "duration_ms": 12500,
    "tech_stack_count": 8,
    "confidence_score": 0.92
  }
}
```

### Alarms

**Critical Alarms:**
- Analysis failure rate > 10%
- Average latency > 20 seconds
- GitHub API rate limit reached
- Agent invocation errors > 5 per minute

**Warning Alarms:**
- Cache hit rate < 30%
- Analysis latency > 15 seconds
- GitHub API calls > 4000 per hour

## Security Considerations

### Authentication & Authorization

- Backend API requires API key authentication
- GitHub token stored in AWS Secrets Manager
- AgentCore IAM role with least privilege permissions
- Frontend uses AWS Amplify authentication

### Data Privacy

- No storage of repository code content
- Analysis results cached with TTL
- User data encrypted at rest and in transit
- Compliance with GitHub API terms of service

### Rate Limiting

- Frontend: 10 requests per minute per user
- Backend: 100 requests per minute per API key
- GitHub API: Respect rate limit headers
- AgentCore: Monitor invocation quotas

## Extensibility for Multi-Agent Architecture

The design is built with extensibility in mind to support the PRD's vision of multiple specialized agents (Event Aggregation Agent, Matching & Recommendation Agent).

### Agent Registry Pattern

**Backend Service Layer:**

```python
# backend/app/services/agent_registry.py
from typing import Dict, Callable
from dataclasses import dataclass

@dataclass
class AgentConfig:
    agent_runtime_arn: str
    name: str
    description: str
    invoke_handler: Callable

class AgentRegistry:
    """Central registry for managing multiple AgentCore agents"""
    
    def __init__(self):
        self._agents: Dict[str, AgentConfig] = {}
    
    def register(self, agent_id: str, config: AgentConfig):
        """Register a new agent"""
        self._agents[agent_id] = config
    
    def get_agent(self, agent_id: str) -> AgentConfig:
        """Retrieve agent configuration"""
        return self._agents.get(agent_id)
    
    def list_agents(self) -> list[str]:
        """List all registered agent IDs"""
        return list(self._agents.keys())

# Initialize registry
agent_registry = AgentRegistry()

# Register Project Intelligence Agent
agent_registry.register("project-intelligence", AgentConfig(
    agent_runtime_arn=os.environ["PROJECT_AGENT_ARN"],
    name="Project Intelligence Agent",
    description="Analyzes GitHub repositories",
    invoke_handler=invoke_project_agent
))

# Future agents can be easily added:
# agent_registry.register("event-aggregation", AgentConfig(...))
# agent_registry.register("matching-recommendation", AgentConfig(...))
```

### Unified Agent Invocation Interface

```python
# backend/app/services/agent_invoker.py
import boto3
from typing import Dict, Any

class AgentInvoker:
    """Unified interface for invoking any registered agent"""
    
    def __init__(self, agent_registry: AgentRegistry):
        self.registry = agent_registry
        self.client = boto3.client('bedrock-agentcore')
    
    async def invoke(
        self, 
        agent_id: str, 
        payload: Dict[str, Any],
        session_id: str | None = None
    ) -> Dict[str, Any]:
        """Invoke any agent by ID"""
        agent_config = self.registry.get_agent(agent_id)
        
        if not agent_config:
            raise ValueError(f"Agent {agent_id} not found")
        
        response = self.client.invoke_agent_runtime(
            agentRuntimeArn=agent_config.agent_runtime_arn,
            runtimeSessionId=session_id or self._generate_session_id(),
            payload=json.dumps(payload).encode()
        )
        
        return self._parse_response(response)
```

### Multi-Agent Orchestration (Future)

For Phase 2, when multiple agents need to collaborate:

```python
# backend/app/services/agent_orchestrator.py
class AgentOrchestrator:
    """Orchestrates workflows across multiple agents"""
    
    async def analyze_and_match_project(
        self, 
        repo_url: str,
        user_profile: Dict
    ) -> Dict:
        """
        Example multi-agent workflow:
        1. Project Intelligence Agent analyzes repository
        2. Matching Agent finds relevant investors
        """
        # Step 1: Analyze project
        analysis = await self.invoker.invoke(
            "project-intelligence",
            {"repository_url": repo_url}
        )
        
        # Step 2: Find matches based on analysis
        matches = await self.invoker.invoke(
            "matching-recommendation",
            {
                "project_analysis": analysis,
                "user_profile": user_profile
            }
        )
        
        return {
            "analysis": analysis,
            "matches": matches
        }
```

### Agent Deployment Structure

```
agents/
├── project-intelligence/
│   ├── pyproject.toml
│   ├── project_intelligence_agent.py
│   └── agentcore.yaml
├── event-aggregation/          # Future
│   ├── pyproject.toml
│   ├── event_aggregation_agent.py
│   └── agentcore.yaml
└── matching-recommendation/    # Future
    ├── pyproject.toml
    ├── matching_agent.py
    └── agentcore.yaml
```

Each agent is independently deployable using `agentcore launch`, and the backend registry manages routing to the appropriate agent.

### Configuration Management

```yaml
# backend/config/agents.yaml
agents:
  project-intelligence:
    runtime_arn: ${PROJECT_AGENT_ARN}
    timeout: 30
    retry_attempts: 3
    
  event-aggregation:  # Future
    runtime_arn: ${EVENT_AGENT_ARN}
    timeout: 60
    retry_attempts: 2
    
  matching-recommendation:  # Future
    runtime_arn: ${MATCHING_AGENT_ARN}
    timeout: 45
    retry_attempts: 3
```

This architecture ensures:
- **Loose Coupling**: Each agent is independent and can be developed/deployed separately
- **Easy Addition**: New agents require minimal backend changes (register + configure)
- **Scalability**: AgentCore Runtime handles scaling for each agent independently
- **Maintainability**: Clear separation of concerns between agents

## Future Enhancements

### Phase 2 Improvements

1. **Additional Agents:**
   - Event Aggregation Agent (monitors hackathon platforms)
   - Matching & Recommendation Agent (connects projects with investors)
   - Portfolio Generation Agent (creates professional portfolios)

2. **Streaming Analysis Results:**
   - Real-time updates as agent processes
   - Progressive rendering of analysis sections
   - WebSocket connection for live updates

3. **Advanced Code Analysis:**
   - Code quality scoring
   - Security vulnerability detection
   - Performance optimization suggestions

4. **Multi-Repository Analysis:**
   - Batch analysis of multiple projects
   - Comparison between projects
   - Portfolio-level insights

5. **Enhanced Caching:**
   - DynamoDB for persistent cache
   - Incremental updates for changed repositories
   - Smart cache invalidation

6. **Agent Improvements:**
   - Fine-tuned models for better accuracy
   - Custom tools for framework-specific analysis
   - Integration with additional code analysis tools

7. **Multi-Modal Analysis (Phase 3):**
   - Video demo analysis (extract features from demo videos)
   - Screenshot/diagram analysis (understand architecture from images)
   - Documentation image processing (extract information from visual docs)

### Multi-Modal Support Design (Future)

The current design is extensible to support multi-modal inputs:

**Agent Enhancement:**
```python
# Future: Multi-modal agent with Nova Premier
project_agent = Agent(
    model="us.amazon.nova-premier-v1:0",  # Supports images, video, documents
    tools=[http_request, video_analyzer, image_analyzer]
)

@app.entrypoint
def analyze_project(payload: dict) -> dict:
    repo_url = payload.get("repository_url")
    include_media = payload.get("options", {}).get("include_media", False)
    
    prompt = f"""Analyze the GitHub repository at {repo_url}.
    
    {"Include analysis of demo videos, screenshots, and diagrams." if include_media else ""}
    
    For media files:
    1. Fetch video URLs from README or repository
    2. Extract key frames and analyze UI/UX
    3. Identify features demonstrated in videos
    4. Analyze architecture diagrams and screenshots
    """
    
    result = project_agent(prompt)
    return {"analysis": result.message}
```

**Media Processing Tools:**
```python
from strands import tool

@tool
async def analyze_video(video_url: str) -> dict:
    """
    Analyzes demo video to extract features and UI elements.
    Uses Nova Premier's video understanding capabilities.
    """
    # Download video frames
    # Pass to Nova Premier for analysis
    pass

@tool
async def analyze_image(image_url: str) -> dict:
    """
    Analyzes screenshots, diagrams, or documentation images.
    Uses Nova Premier's image understanding capabilities.
    """
    # Download image
    # Pass to Nova Premier for analysis
    pass
```

**Data Model Extension:**
```typescript
// frontend/src/lib/types/analysis.ts
export interface ProjectAnalysis {
  // ... existing fields ...
  mediaAnalysis?: MediaAnalysis;  // Future field
}

export interface MediaAnalysis {
  videos: VideoAnalysis[];
  images: ImageAnalysis[];
  diagrams: DiagramAnalysis[];
}

export interface VideoAnalysis {
  url: string;
  duration: number;
  keyFeatures: string[];
  uiElements: string[];
  technologiesIdentified: string[];
  confidence: number;
}

export interface ImageAnalysis {
  url: string;
  type: 'screenshot' | 'diagram' | 'documentation';
  description: string;
  extractedText: string;
  confidence: number;
}
```

**Why Nova Premier for Multi-Modal:**
- Supports images, video, and documents natively
- No need for separate vision models
- Unified API for all modalities
- Better context understanding across modalities

**Implementation Path:**
1. **Day 3 (MVP)**: Text-only analysis with Nova Micro
2. **Phase 2**: Add image analysis with Nova Lite
3. **Phase 3**: Full multi-modal with Nova Premier (video + images + documents)

This design ensures the current implementation doesn't block future multi-modal capabilities.
