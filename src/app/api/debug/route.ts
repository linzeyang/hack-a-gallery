import { NextResponse } from "next/server";

export async function GET() {
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
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "SET (hidden)" : "NOT SET",
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
}
