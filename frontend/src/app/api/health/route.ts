import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/utils/storage";

/**
 * Health Check Endpoint
 *
 * Tests DynamoDB connectivity and returns the health status of the application.
 *
 * Returns:
 * - 200 OK: DynamoDB is accessible and healthy
 * - 503 Service Unavailable: DynamoDB connection failed
 *
 * Response format:
 * {
 *   status: 'healthy' | 'unhealthy',
 *   timestamp: ISO 8601 timestamp,
 *   storage: 'dynamodb' | 'localstorage',
 *   error?: string (only present when unhealthy)
 * }
 */
export async function GET() {
  try {
    const adapter = getStorageAdapter();

    // Determine storage type
    const storageType = adapter.constructor.name
      .toLowerCase()
      .includes("dynamodb")
      ? "dynamodb"
      : "localstorage";

    // Simple health check: try to query the table
    // This verifies:
    // 1. AWS credentials are valid
    // 2. DynamoDB table exists
    // 3. Network connectivity is working
    // 4. IAM permissions are correct
    await adapter.getAll("event:");

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      storage: storageType,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        storage: "dynamodb",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
