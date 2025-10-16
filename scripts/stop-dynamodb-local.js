#!/usr/bin/env node

/**
 * Stop DynamoDB Local process
 */

import { join } from "path";
import { existsSync, readFileSync, unlinkSync } from "fs";

const DATA_DIR = join(__dirname, "..", ".dynamodb-local");
const PID_FILE = join(DATA_DIR, "dynamodb.pid");

console.log("=".repeat(60));
console.log("Stopping DynamoDB Local");
console.log("=".repeat(60));
console.log("");

if (!existsSync(PID_FILE)) {
  console.log("✓ DynamoDB Local is not running");
  process.exit(0);
}

const pid = readFileSync(PID_FILE, "utf8").trim();

try {
  // Try to kill the process
  process.kill(pid, "SIGTERM");

  // Wait a bit for graceful shutdown
  setTimeout(() => {
    try {
      process.kill(pid, 0); // Check if still running
      // Still running, force kill
      process.kill(pid, "SIGKILL");
      console.log("✓ DynamoDB Local stopped (forced)");
    } catch (_e) {
      console.log("✓ DynamoDB Local stopped");
    }

    // Remove PID file
    unlinkSync(PID_FILE);
    console.log("");
  }, 1000);
} catch (error) {
  if (error.code === "ESRCH") {
    // Process doesn't exist
    console.log("✓ DynamoDB Local was not running");
    unlinkSync(PID_FILE);
  } else {
    console.error("✗ Error stopping DynamoDB Local:", error.message);
    process.exit(1);
  }
}
