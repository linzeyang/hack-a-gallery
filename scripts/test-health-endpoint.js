#!/usr/bin/env node

/**
 * Test Health Endpoint
 *
 * This script tests the /api/health endpoint to verify:
 * 1. The endpoint is accessible
 * 2. DynamoDB connectivity is working
 * 3. The response format is correct
 *
 * Usage:
 *   node scripts/test-health-endpoint.js [url]
 *
 * Examples:
 *   node scripts/test-health-endpoint.js
 *   node scripts/test-health-endpoint.js http://localhost:3000
 *   node scripts/test-health-endpoint.js https://your-app.vercel.app
 */

const baseUrl = process.argv[2] || "http://localhost:3000";
const healthUrl = `${baseUrl}/api/health`;

console.log("🏥 Testing Health Endpoint");
console.log("========================");
console.log(`URL: ${healthUrl}\n`);

async function testHealthEndpoint() {
  try {
    console.log("⏳ Sending request...");
    const response = await fetch(healthUrl);

    console.log(
      `\n📊 Response Status: ${response.status} ${response.statusText}`
    );

    const data = await response.json();

    console.log("\n📦 Response Body:");
    console.log(JSON.stringify(data, null, 2));

    // Validate response structure
    console.log("\n✅ Validation:");

    if (!data.status) {
      console.log("❌ Missing 'status' field");
      process.exit(1);
    }
    console.log(`✓ Status: ${data.status}`);

    if (!data.timestamp) {
      console.log("❌ Missing 'timestamp' field");
      process.exit(1);
    }
    console.log(`✓ Timestamp: ${data.timestamp}`);

    if (!data.storage) {
      console.log("❌ Missing 'storage' field");
      process.exit(1);
    }
    console.log(`✓ Storage: ${data.storage}`);

    // Check health status
    if (response.status === 200 && data.status === "healthy") {
      console.log("\n✅ Health check PASSED - System is healthy!");
      process.exit(0);
    } else if (response.status === 503 && data.status === "unhealthy") {
      console.log("\n⚠️  Health check returned unhealthy status");
      if (data.error) {
        console.log(`Error: ${data.error}`);
      }
      console.log("\nThis is expected if:");
      console.log("- DynamoDB Local is not running");
      console.log("- Environment variables are not configured");
      console.log("- AWS credentials are invalid");
      process.exit(1);
    } else {
      console.log("\n❌ Unexpected response");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Error testing health endpoint:");
    console.error(error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Make sure the application is running:");
      console.log("   npm run dev");
    }

    process.exit(1);
  }
}

testHealthEndpoint();
