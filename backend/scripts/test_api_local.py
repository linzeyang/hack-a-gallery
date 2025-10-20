#!/usr/bin/env python3
"""
Comprehensive local testing script for the backend API.

This script tests:
1. Server startup and health checks
2. /api/projects/analyze endpoint with valid repository
3. AgentCore invocation verification
4. Error scenarios (invalid URL, repository not found, rate limits)

Usage:
    python test_api_local.py
"""

import asyncio
import json
import sys
import time
from typing import Any

import httpx


class Colors:
    """ANSI color codes for terminal output."""

    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    RESET = "\033[0m"
    BOLD = "\033[1m"


class APITester:
    """Test harness for backend API."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60.0)
        self.test_results: list[dict[str, Any]] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    def print_header(self, text: str) -> None:
        """Print a formatted test section header."""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 70}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 70}{Colors.RESET}\n")

    def print_test(self, name: str) -> None:
        """Print test name."""
        print(f"{Colors.BOLD}Testing:{Colors.RESET} {name}")

    def print_success(self, message: str) -> None:
        """Print success message."""
        print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")

    def print_error(self, message: str) -> None:
        """Print error message."""
        print(f"{Colors.RED}✗ {message}{Colors.RESET}")

    def print_warning(self, message: str) -> None:
        """Print warning message."""
        print(f"{Colors.YELLOW}⚠ {message}{Colors.RESET}")

    def print_info(self, message: str) -> None:
        """Print info message."""
        print(f"  {message}")

    def record_result(self, test_name: str, passed: bool, message: str = "") -> None:
        """Record test result."""
        self.test_results.append({"test": test_name, "passed": passed, "message": message})

    async def test_server_health(self) -> bool:
        """Test 1: Server health check."""
        self.print_test("Server health check")

        try:
            response = await self.client.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                self.print_success(f"Server is healthy: {data}")
                self.record_result("Server Health", True)
                return True
            else:
                self.print_error(f"Server returned status {response.status_code}")
                self.record_result("Server Health", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_error(f"Failed to connect to server: {e}")
            self.record_result("Server Health", False, str(e))
            return False

    async def test_health_endpoint(self) -> bool:
        """Test 2: Detailed health endpoint."""
        self.print_test("Detailed health endpoint")

        try:
            response = await self.client.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                self.print_success("Health endpoint returned detailed info")
                self.print_info(f"Status: {data.get('status')}")
                self.print_info(f"Agents: {data.get('agents')}")
                self.print_info(f"Config: {json.dumps(data.get('config'), indent=2)}")
                self.record_result("Health Endpoint", True)
                return True
            else:
                self.print_error(f"Health endpoint returned status {response.status_code}")
                self.record_result("Health Endpoint", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_error(f"Failed to call health endpoint: {e}")
            self.record_result("Health Endpoint", False, str(e))
            return False

    async def test_analyze_valid_repository(self) -> bool:
        """Test 3: Analyze a valid public repository."""
        self.print_test("Analyze valid public repository")

        # Use a small, well-known repository for testing
        test_repo = "https://github.com/octocat/Hello-World"

        payload = {"repository_url": test_repo}

        try:
            self.print_info(f"Analyzing: {test_repo}")
            self.print_info("This may take 15-30 seconds...")

            start_time = time.time()
            response = await self.client.post(f"{self.base_url}/api/projects/analyze", json=payload)
            elapsed = time.time() - start_time

            self.print_info(f"Response time: {elapsed:.2f}s")

            if response.status_code == 200:
                data = response.json()

                # Verify response structure
                if data.get("success"):
                    self.print_success("Analysis completed successfully")

                    analysis = data.get("data", {})
                    self.print_info(f"Request ID: {data.get('request_id')}")
                    self.print_info(f"Summary: {analysis.get('summary', 'N/A')[:100]}...")
                    self.print_info(f"Technologies: {len(analysis.get('technologies', []))}")
                    self.print_info(f"Tags: {len(analysis.get('tags', []))}")
                    self.print_info(f"Key Features: {len(analysis.get('key_features', []))}")

                    metadata = analysis.get("metadata", {})
                    self.print_info(f"Processing time: {metadata.get('processing_time_ms')}ms")

                    self.record_result("Valid Repository Analysis", True)
                    return True
                else:
                    self.print_error(f"Analysis failed: {data.get('error')}")
                    self.record_result(
                        "Valid Repository Analysis", False, data.get("error", {}).get("message")
                    )
                    return False
            else:
                self.print_error(f"API returned status {response.status_code}")
                self.print_info(f"Response: {response.text}")
                self.record_result(
                    "Valid Repository Analysis", False, f"Status: {response.status_code}"
                )
                return False

        except Exception as e:
            self.print_error(f"Test failed with exception: {e}")
            self.record_result("Valid Repository Analysis", False, str(e))
            return False

    async def test_invalid_url_format(self) -> bool:
        """Test 4: Invalid GitHub URL format."""
        self.print_test("Invalid GitHub URL format")

        invalid_urls = [
            "not-a-url",
            "https://gitlab.com/user/repo",
            "https://github.com/",
            "https://github.com/user",
            "ftp://github.com/user/repo",
        ]

        all_passed = True

        for url in invalid_urls:
            payload = {"repository_url": url}

            try:
                response = await self.client.post(
                    f"{self.base_url}/api/projects/analyze", json=payload
                )

                if response.status_code == 400:
                    data = response.json()
                    self.print_success(f"Correctly rejected: {url}")
                    self.print_info(f"Error: {data.get('error', {}).get('message')}")
                elif response.status_code == 422:
                    # Pydantic validation error
                    self.print_success(f"Correctly rejected by validation: {url}")
                else:
                    self.print_error(f"Expected 400/422, got {response.status_code} for: {url}")
                    all_passed = False

            except Exception as e:
                self.print_error(f"Test failed for {url}: {e}")
                all_passed = False

        self.record_result("Invalid URL Format", all_passed)
        return all_passed

    async def test_repository_not_found(self) -> bool:
        """Test 5: Repository not found."""
        self.print_test("Repository not found")

        # Use a repository that definitely doesn't exist (shorter username)
        nonexistent_repo = "https://github.com/nonexistent-user-xyz/nonexistent-repo-xyz"

        payload = {"repository_url": nonexistent_repo}

        try:
            response = await self.client.post(f"{self.base_url}/api/projects/analyze", json=payload)

            if response.status_code == 404:
                data = response.json()
                self.print_success("Correctly returned 404 for nonexistent repository")
                self.print_info(f"Error: {data.get('error', {}).get('message')}")
                self.record_result("Repository Not Found", True)
                return True
            else:
                self.print_error(f"Expected 404, got {response.status_code}")
                self.print_info(f"Response: {response.text}")
                self.record_result("Repository Not Found", False, f"Status: {response.status_code}")
                return False

        except Exception as e:
            self.print_error(f"Test failed with exception: {e}")
            self.record_result("Repository Not Found", False, str(e))
            return False

    async def test_private_repository(self) -> bool:
        """Test 6: Private repository (should fail without access)."""
        self.print_test("Private repository access")

        # Use a known private repository pattern
        # Note: This will fail unless the GitHub token has access
        private_repo = "https://github.com/github/private-test-repo"

        payload = {"repository_url": private_repo}

        try:
            response = await self.client.post(f"{self.base_url}/api/projects/analyze", json=payload)

            if response.status_code in [404, 403]:
                data = response.json()
                self.print_success("Correctly handled private repository")
                self.print_info(f"Status: {response.status_code}")
                self.print_info(f"Error: {data.get('error', {}).get('message')}")
                self.record_result("Private Repository", True)
                return True
            elif response.status_code == 200:
                self.print_warning("Repository was accessible (token may have access)")
                self.record_result("Private Repository", True, "Token has access")
                return True
            else:
                self.print_error(f"Unexpected status code: {response.status_code}")
                self.record_result("Private Repository", False, f"Status: {response.status_code}")
                return False

        except Exception as e:
            self.print_error(f"Test failed with exception: {e}")
            self.record_result("Private Repository", False, str(e))
            return False

    async def test_cache_functionality(self) -> bool:
        """Test 7: Cache functionality (second request should be faster)."""
        self.print_test("Cache functionality")

        # Use a different repository to avoid cache from previous tests
        test_repo = "https://github.com/torvalds/linux"
        payload = {"repository_url": test_repo}

        try:
            # First request
            self.print_info("First request (should invoke agent)...")
            start_time = time.time()
            response1 = await self.client.post(
                f"{self.base_url}/api/projects/analyze", json=payload
            )
            elapsed1 = time.time() - start_time

            if response1.status_code != 200:
                self.print_error(f"First request failed: {response1.status_code}")
                self.record_result("Cache Functionality", False, "First request failed")
                return False

            # Second request (should be cached)
            self.print_info("Second request (should use cache)...")
            start_time = time.time()
            response2 = await self.client.post(
                f"{self.base_url}/api/projects/analyze", json=payload
            )
            elapsed2 = time.time() - start_time

            if response2.status_code != 200:
                self.print_error(f"Second request failed: {response2.status_code}")
                self.record_result("Cache Functionality", False, "Second request failed")
                return False

            self.print_info(f"First request: {elapsed1:.2f}s")
            self.print_info(f"Second request: {elapsed2:.2f}s")

            # Second request should be significantly faster (cached)
            if elapsed2 < elapsed1 * 0.5:  # At least 50% faster
                self.print_success("Cache is working (second request was faster)")
                self.record_result("Cache Functionality", True)
                return True
            else:
                self.print_warning(
                    "Second request wasn't significantly faster (cache may not be working)"
                )
                self.record_result("Cache Functionality", False, "No significant speedup")
                return False

        except Exception as e:
            self.print_error(f"Test failed with exception: {e}")
            self.record_result("Cache Functionality", False, str(e))
            return False

    async def test_agentcore_invocation(self) -> bool:
        """Test 8: Verify AgentCore invocation (check logs)."""
        self.print_test("AgentCore invocation verification")

        test_repo = "https://github.com/octocat/Hello-World"
        payload = {"repository_url": test_repo}

        try:
            self.print_info("Analyzing repository to verify agent invocation...")
            response = await self.client.post(f"{self.base_url}/api/projects/analyze", json=payload)

            if response.status_code == 200:
                data = response.json()

                # Check if response has agent metadata
                metadata = data.get("data", {}).get("metadata", {})
                agent_name = metadata.get("agent_name")

                if agent_name == "project_intelligence":
                    self.print_success("AgentCore invocation verified")
                    self.print_info(f"Agent: {agent_name}")
                    self.print_info(f"Processing time: {metadata.get('processing_time_ms')}ms")
                    self.record_result("AgentCore Invocation", True)
                    return True
                else:
                    self.print_warning(f"Agent name mismatch: {agent_name}")
                    self.record_result("AgentCore Invocation", False, "Agent name mismatch")
                    return False
            else:
                self.print_error(f"Analysis failed: {response.status_code}")
                self.record_result("AgentCore Invocation", False, f"Status: {response.status_code}")
                return False

        except Exception as e:
            self.print_error(f"Test failed with exception: {e}")
            self.record_result("AgentCore Invocation", False, str(e))
            return False

    def print_summary(self) -> bool:
        """Print test summary."""
        self.print_header("TEST SUMMARY")

        passed = sum(1 for r in self.test_results if r["passed"])
        total = len(self.test_results)

        print(f"\n{Colors.BOLD}Results: {passed}/{total} tests passed{Colors.RESET}\n")

        for result in self.test_results:
            status = (
                f"{Colors.GREEN}✓ PASS{Colors.RESET}"
                if result["passed"]
                else f"{Colors.RED}✗ FAIL{Colors.RESET}"
            )
            print(f"{status} - {result['test']}")
            if result["message"]:
                print(f"       {Colors.YELLOW}{result['message']}{Colors.RESET}")

        print()

        if passed == total:
            self.print_success(f"All {total} tests passed! 🎉")
            return True
        else:
            self.print_error(f"{total - passed} test(s) failed")
            return False

    async def run_all_tests(self) -> bool:
        """Run all tests in sequence."""
        self.print_header("BACKEND API LOCAL TESTING")

        print(f"{Colors.BOLD}Base URL:{Colors.RESET} {self.base_url}")
        print(f"{Colors.BOLD}Timeout:{Colors.RESET} 60 seconds\n")

        # Test 1: Server health
        if not await self.test_server_health():
            self.print_error("Server is not running. Please start the server first.")
            self.print_info("Run: cd backend && uvicorn app.main:app --reload")
            return False

        # Test 2: Health endpoint
        await self.test_health_endpoint()

        # Test 3: Valid repository analysis
        self.print_header("FUNCTIONAL TESTS")
        await self.test_analyze_valid_repository()

        # Test 4-6: Error scenarios
        self.print_header("ERROR SCENARIO TESTS")
        await self.test_invalid_url_format()
        await self.test_repository_not_found()
        await self.test_private_repository()

        # Test 7: Cache functionality
        self.print_header("PERFORMANCE TESTS")
        await self.test_cache_functionality()

        # Test 8: AgentCore invocation
        self.print_header("INTEGRATION TESTS")
        await self.test_agentcore_invocation()

        # Print summary
        return self.print_summary()


async def main():
    """Main test execution."""
    base_url = "http://localhost:8000"

    print(f"\n{Colors.BOLD}Starting Backend API Tests...{Colors.RESET}\n")
    print(f"Make sure the server is running at {base_url}")
    print("To start the server: cd backend && uvicorn app.main:app --reload\n")

    async with APITester(base_url) as tester:
        success = await tester.run_all_tests()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
