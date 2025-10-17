#!/usr/bin/env node

/**
 * Cold Start Performance Testing Script
 *
 * Tests SSR performance and DynamoDB connection pooling by measuring:
 * - Cold start (first request after deployment/idle)
 * - Warm requests (subsequent requests with connection reuse)
 * - Time to First Byte (TTFB)
 * - Total request time
 *
 * Usage:
 *   node scripts/test-cold-start-performance.js
 *   TEST_URL=https://your-app.com node scripts/test-cold-start-performance.js
 */

import https from "https";
import http from "http";

// Configuration
const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const WARM_REQUEST_COUNT = 5;
const REQUEST_DELAY_MS = 200;

// Test endpoints
const endpoints = [
  { name: "Event Listing", path: "/events", method: "GET" },
  { name: "Health Check", path: "/api/health", method: "GET" },
];

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

/**
 * Measure HTTP request performance
 * @param {string} url - Full URL to test
 * @param {string} method - HTTP method
 * @returns {Promise<Object>} Performance metrics
 */
async function measureRequest(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        "User-Agent": "HackaGallery-Performance-Test/1.0",
      },
    };

    const req = client.request(options, (res) => {
      let data = "";
      let firstByteTime = null;

      res.on("data", (chunk) => {
        if (firstByteTime === null) {
          firstByteTime = Date.now();
        }
        data += chunk;
      });

      res.on("end", () => {
        const endTime = Date.now();
        const ttfb = firstByteTime
          ? firstByteTime - startTime
          : endTime - startTime;
        const totalTime = endTime - startTime;

        resolve({
          statusCode: res.statusCode,
          ttfb,
          totalTime,
          size: Buffer.byteLength(data),
          headers: res.headers,
        });
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Request timeout (30s)"));
    });

    req.end();
  });
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Get status indicator based on performance
 * @param {number} value - Measured value
 * @param {number} target - Target value
 * @returns {string} Status indicator with color
 */
function getStatus(value, target) {
  if (value < target) {
    return `${colors.green}✅${colors.reset}`;
  } else if (value < target * 1.5) {
    return `${colors.yellow}⚠️${colors.reset}`;
  } else {
    return `${colors.red}❌${colors.reset}`;
  }
}

/**
 * Test a single endpoint
 * @param {Object} endpoint - Endpoint configuration
 * @returns {Promise<Object>} Test results
 */
async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;

  console.log(
    `\n${colors.bright}${colors.cyan}Testing: ${endpoint.name}${colors.reset}`
  );
  console.log(`${colors.gray}URL: ${url}${colors.reset}`);
  console.log("─".repeat(70));

  try {
    // Cold start test
    console.log(
      `\n${colors.bright}Cold Start (first request)...${colors.reset}`
    );
    const coldStart = await measureRequest(url, endpoint.method);

    console.log(`  Status: ${coldStart.statusCode}`);
    console.log(`  TTFB: ${coldStart.ttfb}ms`);
    console.log(`  Total: ${coldStart.totalTime}ms`);
    console.log(`  Size: ${formatBytes(coldStart.size)}`);

    // Wait before warm requests
    await sleep(1000);

    // Warm request tests
    console.log(
      `\n${colors.bright}Warm Requests (${WARM_REQUEST_COUNT} samples)...${colors.reset}`
    );
    const warmRequests = [];

    for (let i = 0; i < WARM_REQUEST_COUNT; i++) {
      const result = await measureRequest(url, endpoint.method);
      warmRequests.push(result);
      console.log(
        `  Request ${i + 1}: TTFB ${result.ttfb}ms, Total ${result.totalTime}ms`
      );

      if (i < WARM_REQUEST_COUNT - 1) {
        await sleep(REQUEST_DELAY_MS);
      }
    }

    // Calculate statistics
    const avgTtfb =
      warmRequests.reduce((sum, r) => sum + r.ttfb, 0) / warmRequests.length;
    const avgTotal =
      warmRequests.reduce((sum, r) => sum + r.totalTime, 0) /
      warmRequests.length;
    const minTtfb = Math.min(...warmRequests.map((r) => r.ttfb));
    const maxTtfb = Math.max(...warmRequests.map((r) => r.ttfb));

    const improvement = ((coldStart.ttfb - avgTtfb) / coldStart.ttfb) * 100;

    console.log(`\n${colors.bright}Statistics:${colors.reset}`);
    console.log(`  Cold Start TTFB: ${coldStart.ttfb}ms`);
    console.log(`  Warm Avg TTFB: ${avgTtfb.toFixed(0)}ms`);
    console.log(`  Warm Min TTFB: ${minTtfb}ms`);
    console.log(`  Warm Max TTFB: ${maxTtfb}ms`);
    console.log(`  Warm Avg Total: ${avgTotal.toFixed(0)}ms`);
    console.log(
      `  Improvement: ${colors.green}${improvement.toFixed(1)}%${colors.reset}`
    );

    return {
      endpoint: endpoint.name,
      success: true,
      coldStart,
      warmAvg: { ttfb: avgTtfb, totalTime: avgTotal },
      warmMin: { ttfb: minTtfb },
      warmMax: { ttfb: maxTtfb },
      improvement,
    };
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    return {
      endpoint: endpoint.name,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Run all performance tests
 */
async function runTests() {
  console.log("═".repeat(70));
  console.log(
    `${colors.bright}${colors.cyan}Cold Start Performance Test${colors.reset}`
  );
  console.log("═".repeat(70));
  console.log(`${colors.gray}Base URL: ${BASE_URL}${colors.reset}`);
  console.log(
    `${colors.gray}Timestamp: ${new Date().toISOString()}${colors.reset}`
  );
  console.log(
    `${colors.gray}Warm Request Count: ${WARM_REQUEST_COUNT}${colors.reset}`
  );

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }

  // Summary
  console.log("\n" + "═".repeat(70));
  console.log(`${colors.bright}${colors.cyan}Summary${colors.reset}`);
  console.log("═".repeat(70));

  const successfulResults = results.filter((r) => r.success);

  if (successfulResults.length === 0) {
    console.log(
      `\n${colors.red}All tests failed. Please check your application is running.${colors.reset}`
    );
    process.exit(1);
  }

  successfulResults.forEach((result) => {
    console.log(`\n${colors.bright}${result.endpoint}:${colors.reset}`);
    console.log(`  Cold Start: ${result.coldStart.ttfb}ms TTFB`);
    console.log(`  Warm Avg: ${result.warmAvg.ttfb.toFixed(0)}ms TTFB`);
    console.log(`  Improvement: ${result.improvement.toFixed(1)}%`);

    // Performance targets
    const coldTarget = 2000; // 2 seconds for cold start
    const warmTarget = 200; // 200ms for warm requests

    const coldStatus = getStatus(result.coldStart.ttfb, coldTarget);
    const warmStatus = getStatus(result.warmAvg.ttfb, warmTarget);

    console.log(
      `  Cold Start Status: ${coldStatus} (target < ${coldTarget}ms)`
    );
    console.log(
      `  Warm Request Status: ${warmStatus} (target < ${warmTarget}ms)`
    );
  });

  // Connection pooling verification
  console.log(`\n${colors.bright}Connection Pooling Analysis:${colors.reset}`);
  successfulResults.forEach((result) => {
    const poolingEffective = result.improvement > 30; // At least 30% improvement
    const status = poolingEffective
      ? `${colors.green}✅ Effective${colors.reset}`
      : `${colors.yellow}⚠️ May need optimization${colors.reset}`;

    console.log(
      `  ${result.endpoint}: ${status} (${result.improvement.toFixed(
        1
      )}% improvement)`
    );
  });

  // Overall assessment
  console.log(`\n${colors.bright}Overall Assessment:${colors.reset}`);
  const allColdStartsGood = successfulResults.every(
    (r) => r.coldStart.ttfb < 2000
  );
  const allWarmRequestsGood = successfulResults.every(
    (r) => r.warmAvg.ttfb < 200
  );
  const allPoolingGood = successfulResults.every((r) => r.improvement > 30);

  if (allColdStartsGood && allWarmRequestsGood && allPoolingGood) {
    console.log(
      `  ${colors.green}✅ All performance targets met!${colors.reset}`
    );
    console.log(
      `  ${colors.green}✅ Connection pooling is working effectively.${colors.reset}`
    );
  } else {
    if (!allColdStartsGood) {
      console.log(
        `  ${colors.yellow}⚠️ Some cold starts exceed 2s target.${colors.reset}`
      );
    }
    if (!allWarmRequestsGood) {
      console.log(
        `  ${colors.yellow}⚠️ Some warm requests exceed 200ms target.${colors.reset}`
      );
    }
    if (!allPoolingGood) {
      console.log(
        `  ${colors.yellow}⚠️ Connection pooling may need optimization.${colors.reset}`
      );
    }
  }

  console.log("\n" + "═".repeat(70));
  console.log(
    `${colors.gray}Test completed at ${new Date().toISOString()}${colors.reset}`
  );
  console.log("═".repeat(70));

  // Exit with appropriate code
  const hasFailures = !allColdStartsGood || !allWarmRequestsGood;
  process.exit(hasFailures ? 1 : 0);
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error(
    `${colors.red}Unhandled error: ${error.message}${colors.reset}`
  );
  process.exit(1);
});

// Run tests
console.log(`${colors.gray}Starting performance tests...${colors.reset}\n`);
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
