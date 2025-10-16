#!/usr/bin/env node

/**
 * Start DynamoDB Local without Docker
 * Uses dynamodb-local npm package to run DynamoDB in-process
 */

import { spawn } from "child_process";
import { join, dirname } from "path";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import http from "http";

const PORT = process.env.DYNAMODB_PORT || 8000;
const DATA_DIR = join(__dirname, "..", ".dynamodb-local");
const PID_FILE = join(DATA_DIR, "dynamodb.pid");

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Check if already running
if (existsSync(PID_FILE)) {
  const pid = readFileSync(PID_FILE, "utf8").trim();
  try {
    process.kill(pid, 0); // Check if process exists
    console.log(`DynamoDB Local is already running (PID: ${pid})`);
    console.log(`Listening on http://localhost:${PORT}`);
    console.log("");
    console.log("To stop: npm run dynamodb:stop --prefix frontend");
    process.exit(0);
  } catch (_e) {
    // Process doesn't exist, remove stale PID file
    unlinkSync(PID_FILE);
  }
}

console.log("=".repeat(60));
console.log("Starting DynamoDB Local");
console.log("=".repeat(60));
console.log("");

// Find dynamodb-local jar
const dynamodbLocalPath = join(
  __dirname,
  "..",
  "frontend",
  "node_modules",
  "dynamodb-local",
  "DynamoDBLocal.jar"
);

if (!existsSync(dynamodbLocalPath)) {
  console.error("✗ DynamoDB Local not found!");
  console.error("");
  console.error("Please install dependencies first:");
  console.error("  cd frontend");
  console.error("  npm install");
  process.exit(1);
}

// Start DynamoDB Local
const args = [
  "-Djava.library.path=./DynamoDBLocal_lib",
  "-jar",
  "DynamoDBLocal.jar",
  "-sharedDb",
  "-inMemory",
  "-port",
  PORT.toString(),
];

const dynamoProcess = spawn("java", args, {
  cwd: dirname(dynamodbLocalPath),
  detached: true,
  stdio: "ignore",
});

// Save PID
writeFileSync(PID_FILE, dynamoProcess.pid.toString());

// Unref so parent can exit
dynamoProcess.unref();

console.log("✓ DynamoDB Local started successfully");
console.log("");
console.log("Details:");
console.log(`  - PID: ${dynamoProcess.pid}`);
console.log(`  - Port: ${PORT}`);
console.log(`  - Endpoint: http://localhost:${PORT}`);
console.log(`  - Mode: In-Memory (data will not persist)`);
console.log("");
console.log("Next steps:");
console.log("  1. Create the table:");
console.log("     npm run setup:dynamodb-local --prefix frontend");
console.log("");
console.log("  2. (Optional) Seed data:");
console.log("     npm run seed:local --prefix frontend");
console.log("");
console.log("  3. Start your app:");
console.log("     npm run dev --prefix frontend");
console.log("");
console.log("To stop DynamoDB Local:");
console.log("  npm run dynamodb:stop --prefix frontend");
console.log("");

// Wait a bit to ensure it started
setTimeout(() => {
  const req = http.get(`http://localhost:${PORT}`, (res) => {
    if (res.statusCode === 400) {
      console.log("✓ DynamoDB Local is responding");
      console.log("");
    }
  });

  req.on("error", (_err) => {
    console.error("✗ Warning: Could not verify DynamoDB Local is running");
    console.error("  This might be normal if Java is still starting up");
    console.error(
      "  Wait a few seconds and try: npm run setup:dynamodb-local --prefix frontend"
    );
    console.error("");
  });

  req.end();
}, 2000);
