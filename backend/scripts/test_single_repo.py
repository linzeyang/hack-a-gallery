#!/usr/bin/env python3
"""Quick test script for a single repository analysis."""

import asyncio
import json

import httpx


async def test_repo(repo_url: str):
    """Test analysis of a single repository."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        print(f"\n{'=' * 70}")
        print(f"Testing: {repo_url}")
        print(f"{'=' * 70}\n")

        payload = {"repository_url": repo_url}

        try:
            response = await client.post("http://localhost:8000/api/projects/analyze", json=payload)

            print(f"Status Code: {response.status_code}\n")

            if response.status_code == 200:
                data = response.json()

                print("SUCCESS!")
                print(f"\nRequest ID: {data.get('request_id')}")

                analysis = data.get("data", {})

                print(f"\n{'=' * 70}")
                print("SUMMARY")
                print(f"{'=' * 70}")
                summary = analysis.get("summary", "")
                # Truncate if too long
                if len(summary) > 500:
                    print(f"{summary[:500]}...")
                    print(f"\n[Truncated - Full length: {len(summary)} characters]")
                else:
                    print(summary)

                print(f"\n{'=' * 70}")
                print("TECHNOLOGIES")
                print(f"{'=' * 70}")
                technologies = analysis.get("technologies", [])
                print(f"Count: {len(technologies)}")
                for tech in technologies:
                    print(
                        f"  - {tech.get('name')} ({tech.get('category')}) - Confidence: {tech.get('confidence', 0):.2f}"
                    )

                print(f"\n{'=' * 70}")
                print("TAGS")
                print(f"{'=' * 70}")
                tags = analysis.get("tags", [])
                print(f"Count: {len(tags)}")
                for tag in tags:
                    print(f"  - {tag.get('name')} ({tag.get('category', 'N/A')})")

                print(f"\n{'=' * 70}")
                print("KEY FEATURES")
                print(f"{'=' * 70}")
                features = analysis.get("key_features", [])
                print(f"Count: {len(features)}")
                for i, feature in enumerate(features, 1):
                    print(f"  {i}. {feature}")

                print(f"\n{'=' * 70}")
                print("METADATA")
                print(f"{'=' * 70}")
                metadata = analysis.get("metadata", {})
                print(f"Agent: {metadata.get('agent_name')}")
                print(f"Processing Time: {metadata.get('processing_time_ms')}ms")
                print(f"Timestamp: {metadata.get('timestamp')}")

                print(f"\n{'=' * 70}")
                print("RAW RESPONSE (for debugging)")
                print(f"{'=' * 70}")
                print(json.dumps(data, indent=2))

            else:
                print(f"ERROR: {response.status_code}")
                print(response.text)

        except Exception as e:
            print(f"EXCEPTION: {e}")
            import traceback

            traceback.print_exc()


if __name__ == "__main__":
    import sys

    repo = sys.argv[1] if len(sys.argv) > 1 else "https://github.com/awslabs/mcp"
    asyncio.run(test_repo(repo))
