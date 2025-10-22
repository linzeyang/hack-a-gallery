#!/usr/bin/env node

/**
 * Clear DynamoDB Data Script
 *
 * Removes all items from the DynamoDB table.
 * USE WITH CAUTION - This will delete all data!
 *
 * Usage:
 *   node scripts/clear-dynamodb-data.js [table-name] [region]
 *   node scripts/clear-dynamodb-data.js --local  (for local DynamoDB)
 *
 * Examples:
 *   node scripts/clear-dynamodb-data.js hackagallery-dev us-west-2
 *   node scripts/clear-dynamodb-data.js --local
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import readline from "readline";

// Configuration
const USE_LOCAL = process.argv.includes("--local");
const TABLE_NAME = USE_LOCAL
  ? "hackagallery-local"
  : process.argv[2] || process.env.DYNAMODB_TABLE_NAME || "hackagallery-dev";
const REGION = process.argv[3] || process.env.AWS_REGION || "us-west-2";

// Create DynamoDB client
const clientConfig = {
  region: REGION,
};

if (USE_LOCAL) {
  clientConfig.endpoint = "http://localhost:8000";
  clientConfig.credentials = {
    accessKeyId: "local",
    secretAccessKey: "local",
  };
}

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

// Create readline interface for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function getAllItems() {
  console.log("Scanning table to count items...");
  const items = [];
  let lastEvaluatedKey = undefined;

  do {
    const params = {
      TableName: TABLE_NAME,
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const response = await docClient.send(new ScanCommand(params));
    items.push(...(response.Items || []));
    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

async function deleteItem(item) {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: item.PK,
        SK: item.SK,
      },
    })
  );
}

async function clearTable() {
  console.log("");
  console.log("=".repeat(80));
  console.log("DynamoDB Table Clear Script");
  console.log("=".repeat(80));
  console.log("");
  console.log("Configuration:");
  console.log(`  Table: ${TABLE_NAME}`);
  console.log(`  Region: ${REGION}`);
  console.log(`  Mode: ${USE_LOCAL ? "Local DynamoDB" : "AWS DynamoDB"}`);
  console.log("");

  try {
    // Get all items
    const items = await getAllItems();

    if (items.length === 0) {
      console.log("✓ Table is already empty. No items to delete.");
      console.log("");
      rl.close();
      return;
    }

    // Categorize items
    const events = items.filter((item) => item.entityType === "Event");
    const projects = items.filter((item) => item.entityType === "Project");
    const prizeAwards = items.filter(
      (item) => item.entityType === "PrizeAward"
    );

    console.log("Items found:");
    console.log(`  Events: ${events.length}`);
    console.log(`  Projects: ${projects.length}`);
    console.log(`  Prize Awards: ${prizeAwards.length}`);
    console.log(`  Total: ${items.length}`);
    console.log("");

    // Confirmation prompt
    console.log(
      "\x1b[33m⚠ WARNING: This will permanently delete all data!\x1b[0m"
    );
    console.log("");
    const answer = await askQuestion(
      `Are you sure you want to delete ${items.length} items from ${TABLE_NAME}? (yes/no): `
    );

    if (answer.toLowerCase() !== "yes") {
      console.log("");
      console.log("Operation cancelled. No data was deleted.");
      console.log("");
      rl.close();
      return;
    }

    console.log("");
    console.log("Deleting items...");
    console.log("");

    // Delete all items
    let deletedCount = 0;
    const batchSize = 25; // DynamoDB batch write limit

    for (let i = 0; i < items.length; i++) {
      await deleteItem(items[i]);
      deletedCount++;

      // Show progress every 10 items
      if (deletedCount % 10 === 0 || deletedCount === items.length) {
        process.stdout.write(
          `\r  Progress: ${deletedCount}/${
            items.length
          } items deleted (${Math.round((deletedCount / items.length) * 100)}%)`
        );
      }
    }

    console.log("");
    console.log("");
    console.log("=".repeat(80));
    console.log("Table Cleared Successfully!");
    console.log("=".repeat(80));
    console.log("");
    console.log(`✓ Deleted ${deletedCount} items from ${TABLE_NAME}`);
    console.log("");
    console.log("You can now run the seed script:");
    console.log(`  npm run seed:${USE_LOCAL ? "local" : "aws"}`);
    console.log("");
  } catch (error) {
    console.error("\x1b[31m✗ Failed to clear table\x1b[0m");
    console.error("");
    console.error("Error:", error.message);
    console.error("");

    if (error.name === "ResourceNotFoundException") {
      console.error("Table not found. Please verify:");
      console.error(`  1. Table "${TABLE_NAME}" exists`);
      console.error(`  2. Region is correct: ${REGION}`);
    } else if (error.name === "AccessDeniedException") {
      console.error("Access denied. Please verify:");
      console.error("  1. AWS credentials are configured correctly");
      console.error(
        "  2. IAM permissions include dynamodb:Scan and dynamodb:DeleteItem"
      );
    }

    rl.close();
    process.exit(1);
  }

  rl.close();
}

// Run the clear operation
clearTable();
