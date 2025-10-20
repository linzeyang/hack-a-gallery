"""
Main entry point for the Project Intelligence Agent.

This module serves as the entrypoint for both local testing and AgentCore deployment.
The BedrockAgentCoreApp instance is imported and exposed at the module level.
"""

from src.project_intelligence_agent import app

if __name__ == "__main__":
    print("Starting Project Intelligence Agent...")
    print("Agent is running on http://localhost:8080")
    print("Send POST requests to http://localhost:8080/invocations")
    print("\nExample payload:")
    print('{"repository_url": "https://github.com/owner/repo"}')
    print("\nPress Ctrl+C to stop the agent")
    app.run()
