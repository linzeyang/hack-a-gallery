# PowerShell script for testing the backend API on Windows
# Usage: .\test_with_curl.ps1

$BaseUrl = "http://localhost:8000"

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n================================" -ForegroundColor Yellow
    Write-Host $Message -ForegroundColor Yellow
    Write-Host "================================`n" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

Write-Host "`nBackend API PowerShell Tests" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Cyan

# Test 1: Health check
Write-TestHeader "Test 1: Health Check"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/" -Method Get
    $response | ConvertTo-Json -Depth 10
    Write-Success "Health check passed"
} catch {
    Write-Error "Health check failed: $_"
}

# Test 2: Detailed health
Write-TestHeader "Test 2: Detailed Health Endpoint"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    $response | ConvertTo-Json -Depth 10
    Write-Success "Detailed health check passed"
} catch {
    Write-Error "Detailed health check failed: $_"
}

# Test 3: Analyze valid repository
Write-TestHeader "Test 3: Analyze Valid Repository"
Write-Host "Analyzing: https://github.com/octocat/Hello-World" -ForegroundColor Gray
Write-Host "This may take 15-30 seconds...`n" -ForegroundColor Gray
try {
    $body = @{
        repository_url = "https://github.com/octocat/Hello-World"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/api/projects/analyze" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 60

    $response | ConvertTo-Json -Depth 10
    Write-Success "Valid repository analysis passed"
} catch {
    Write-Error "Valid repository analysis failed: $_"
}

# Test 4: Invalid URL
Write-TestHeader "Test 4: Invalid GitHub URL"
try {
    $body = @{
        repository_url = "not-a-valid-url"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/api/projects/analyze" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    Write-Error "Should have failed with invalid URL"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400 -or $_.Exception.Response.StatusCode -eq 422) {
        Write-Success "Correctly rejected invalid URL"
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } else {
        Write-Error "Unexpected error: $_"
    }
}

# Test 5: Repository not found
Write-TestHeader "Test 5: Repository Not Found"
try {
    $body = @{
        repository_url = "https://github.com/nonexistent-user-12345/nonexistent-repo-98765"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/api/projects/analyze" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    Write-Error "Should have failed with 404"
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Success "Correctly returned 404 for nonexistent repository"
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } else {
        Write-Error "Unexpected error: $_"
    }
}

Write-Host "`n================================" -ForegroundColor Green
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green
