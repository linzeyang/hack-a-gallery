import { NextResponse } from "next/server";

/**
 * Debug endpoint for development environment only
 *
 * This endpoint exposes environment variable status for debugging purposes.
 * It is disabled in production for security reasons.
 */
export async function GET() {
  // Only allow in development environment
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Debug endpoint not available in production" },
      { status: 404 }
    );
  }

  try {
    const envVars = {
      DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || "NOT SET",
      AWS_REGION: process.env.AWS_REGION || "NOT SET",
      HACKAGALLERY_AWS_ACCESS_KEY_ID: process.env.HACKAGALLERY_AWS_ACCESS_KEY_ID
        ? "SET (hidden)"
        : "NOT SET",
      HACKAGALLERY_AWS_SECRET_ACCESS_KEY: process.env
        .HACKAGALLERY_AWS_SECRET_ACCESS_KEY
        ? "SET (hidden)"
        : "NOT SET",
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID
        ? "SET (hidden)"
        : "NOT SET",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
        ? "SET (hidden)"
        : "NOT SET",
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json({
      message: "Environment variables check",
      env: envVars,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
