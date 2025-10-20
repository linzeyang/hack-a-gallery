#!/bin/bash
set -e

echo "🔐 Setting up secrets in AWS Parameter Store..."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your GITHUB_TOKEN"
    exit 1
fi

# Read GITHUB_TOKEN from .env
GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" .env | cut -d '=' -f2)

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN not found in .env file!"
    exit 1
fi

echo "✅ Found GITHUB_TOKEN in .env"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Install from: https://aws.amazon.com/cli/"
    exit 1
fi
echo "✅ AWS CLI found"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run: aws configure"
    exit 1
fi
echo "✅ AWS credentials configured"

echo ""
echo "📝 Storing GITHUB_TOKEN in Parameter Store..."

# Store in Parameter Store
aws ssm put-parameter \
    --name "/hackagallery/github-token" \
    --value "$GITHUB_TOKEN" \
    --type "SecureString" \
    --region us-west-2 \
    --overwrite > /dev/null

echo "✅ GITHUB_TOKEN stored successfully!"

echo ""
echo "🔍 Verifying..."

# Verify
STORED=$(aws ssm get-parameter \
    --name "/hackagallery/github-token" \
    --with-decryption \
    --region us-west-2 \
    --query "Parameter.Value" \
    --output text)

if [ "$STORED" = "$GITHUB_TOKEN" ]; then
    echo "✅ Verification successful!"
else
    echo "⚠️  Stored value doesn't match. Please check."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Use template-with-secrets.yaml for deployment"
echo "2. Run: sam build -t template-with-secrets.yaml"
echo "3. Run: sam deploy --guided"
