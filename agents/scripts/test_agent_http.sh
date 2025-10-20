#!/bin/bash

# Test script for Project Intelligence Agent HTTP interface
# This script tests the agent running locally via HTTP POST requests

echo "=========================================="
echo "  Agent HTTP Interface Testing"
echo "=========================================="
echo ""

# Check if agent is running
echo "Checking if agent is running on http://localhost:8080..."
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null | grep -q "200\|404"; then
    echo "⚠ Agent doesn't appear to be running on port 8080"
    echo ""
    echo "To start the agent, run in another terminal:"
    echo "  cd agent"
    echo "  python src/project_intelligence_agent.py"
    echo ""
    echo "Continuing with tests anyway..."
fi

echo ""
echo "=========================================="
echo "  TEST 1: Valid Public Repository"
echo "=========================================="
echo ""

curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{
    "repository_url": "https://github.com/aws/aws-sdk-python"
  }' \
  2>/dev/null | python -m json.tool

echo ""
echo ""
echo "=========================================="
echo "  TEST 2: Invalid URL Format"
echo "=========================================="
echo ""

curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{
    "repository_url": "not-a-valid-url"
  }' \
  2>/dev/null | python -m json.tool

echo ""
echo ""
echo "=========================================="
echo "  TEST 3: Missing Repository URL"
echo "=========================================="
echo ""

curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{}' \
  2>/dev/null | python -m json.tool

echo ""
echo ""
echo "=========================================="
echo "  TEST 4: Small Repository"
echo "=========================================="
echo ""

curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{
    "repository_url": "https://github.com/octocat/Hello-World"
  }' \
  2>/dev/null | python -m json.tool

echo ""
echo ""
echo "=========================================="
echo "  Tests Complete"
echo "=========================================="
