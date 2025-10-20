# PowerShell script to set up secrets in AWS Parameter Store
$ErrorActionPreference = "Stop"

Write-Host "🔐 Setting up secrets in AWS Parameter Store..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your GITHUB_TOKEN" -ForegroundColor Yellow
    exit 1
}

# Read GITHUB_TOKEN from .env
$githubToken = Get-Content .env | Where-Object { $_ -match "^GITHUB_TOKEN=" } | ForEach-Object { $_.Split('=')[1] }

if (-not $githubToken) {
    Write-Host "❌ GITHUB_TOKEN not found in .env file!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found GITHUB_TOKEN in .env" -ForegroundColor Green
Write-Host ""

# Check AWS CLI
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Install from: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

# Check AWS credentials
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS credentials configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials not configured. Run: aws configure" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Storing GITHUB_TOKEN in Parameter Store..." -ForegroundColor Yellow

# Store in Parameter Store
try {
    aws ssm put-parameter `
        --name "/hackagallery/github-token" `
        --value $githubToken `
        --type "SecureString" `
        --region us-west-2 `
        --overwrite | Out-Null
    
    Write-Host "✅ GITHUB_TOKEN stored successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to store parameter. Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Verifying..." -ForegroundColor Yellow

# Verify
try {
    $stored = aws ssm get-parameter `
        --name "/hackagallery/github-token" `
        --with-decryption `
        --region us-west-2 `
        --query "Parameter.Value" `
        --output text
    
    if ($stored -eq $githubToken) {
        Write-Host "✅ Verification successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Stored value doesn't match. Please check." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not verify. Parameter might still be stored correctly." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Use template-with-secrets.yaml for deployment" -ForegroundColor White
Write-Host "2. Run: sam build -t template-with-secrets.yaml" -ForegroundColor White
Write-Host "3. Run: sam deploy --guided" -ForegroundColor White
