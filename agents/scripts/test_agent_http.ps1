# Test script for Project Intelligence Agent HTTP interface
# This script tests the agent running locally via HTTP POST requests

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Agent HTTP Interface Testing" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if agent is running
Write-Host "Checking if agent is running on http://localhost:8080..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✓ Agent is responding" -ForegroundColor Green
} catch {
    Write-Host "⚠ Agent doesn't appear to be running on port 8080" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To start the agent, run in another terminal:" -ForegroundColor Yellow
    Write-Host "  cd agent" -ForegroundColor White
    Write-Host "  python src/project_intelligence_agent.py" -ForegroundColor White
    Write-Host ""
    Write-Host "Continuing with tests anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  TEST 1: Valid Public Repository" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$body1 = @{
    repository_url = "https://github.com/aws/aws-sdk-python"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/invocations" -Method POST -Body $body1 -ContentType "application/json" -TimeoutSec 60
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  TEST 2: Invalid URL Format" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$body2 = @{
    repository_url = "not-a-valid-url"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/invocations" -Method POST -Body $body2 -ContentType "application/json" -TimeoutSec 30
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  TEST 3: Missing Repository URL" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$body3 = @{} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/invocations" -Method POST -Body $body3 -ContentType "application/json" -TimeoutSec 30
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  TEST 4: Small Repository" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$body4 = @{
    repository_url = "https://github.com/octocat/Hello-World"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/invocations" -Method POST -Body $body4 -ContentType "application/json" -TimeoutSec 60
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Tests Complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
