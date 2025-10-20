"""
Test script for the refactored project intelligence agent.

This script tests the agent locally without deploying to AWS.
"""

import json
import sys
from src.project_intelligence_agent import analyze_project


def test_analyze_project():
    """Test the analyze_project function with a sample repository."""

    # Test with a well-known repository
    test_payload = {"repository_url": "https://github.com/strands-agents/sdk-python"}

    print("Testing refactored agent with GitHub MCP server...")
    print(f"Repository: {test_payload['repository_url']}")
    print("-" * 80)

    try:
        result = analyze_project(test_payload)

        print("\nResult:")
        print(json.dumps(result, indent=2))

        if result.get("status") == "completed":
            print("\n✅ Test PASSED - Analysis completed successfully")

            analysis = result.get("analysis", {})
            print(f"\nSummary: {analysis.get('summary', 'N/A')}")
            print(f"Tech Stack Count: {len(analysis.get('tech_stack', []))}")
            print(f"Confidence Score: {analysis.get('confidence_score', 0)}")

            return 0
        else:
            print("\n❌ Test FAILED - Analysis did not complete")
            print(f"Error: {result.get('error', 'Unknown error')}")
            return 1

    except Exception as e:
        print(f"\n❌ Test FAILED with exception: {str(e)}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(test_analyze_project())
