#!/bin/bash
# Simple curl-based tests for the backend API
# Usage: ./test_with_curl.sh

set -e

BASE_URL="http://localhost:8000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "Backend API Curl Tests"
echo "=================================="
echo ""

# Test 1: Health check
echo -e "${YELLOW}Test 1: Health Check${NC}"
curl -s "$BASE_URL/" | python -m json.tool
echo ""
echo ""

# Test 2: Detailed health
echo -e "${YELLOW}Test 2: Detailed Health Endpoint${NC}"
curl -s "$BASE_URL/health" | python -m json.tool
echo ""
echo ""

# Test 3: Analyze valid repository
echo -e "${YELLOW}Test 3: Analyze Valid Repository${NC}"
echo "Analyzing: https://github.com/octocat/Hello-World"
echo "This may take 15-30 seconds..."
curl -X POST "$BASE_URL/api/projects/analyze" \
  -H "Content-Type: application/json" \
  -d '{"repository_url": "https://github.com/octocat/Hello-World"}' \
  | python -m json.tool
echo ""
echo ""

# Test 4: Invalid URL
echo -e "${YELLOW}Test 4: Invalid GitHub URL${NC}"
curl -X POST "$BASE_URL/api/projects/analyze" \
  -H "Content-Type: application/json" \
  -d '{"repository_url": "not-a-valid-url"}' \
  | python -m json.tool
echo ""
echo ""

# Test 5: Repository not found
echo -e "${YELLOW}Test 5: Repository Not Found${NC}"
curl -X POST "$BASE_URL/api/projects/analyze" \
  -H "Content-Type: application/json" \
  -d '{"repository_url": "https://github.com/nonexistent-user-12345/nonexistent-repo-98765"}' \
  | python -m json.tool
echo ""
echo ""

echo -e "${GREEN}All curl tests completed!${NC}"
