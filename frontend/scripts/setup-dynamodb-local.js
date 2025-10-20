#!/usr/bin/env node

/**
 * Setup script for DynamoDB Local
 * Creates the HackaGallery table with proper schema for local development
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";

const TABLE_NAME = "hackagallery-local";
const ENDPOINT = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";
const REGION = "us-west-2";

const client = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: "local",
    secretAccessKey: "local",
  },
});

async function checkConnection() {
  try {
    await client.send(new ListTablesCommand({}));
    console.log("✓ Successfully connected to DynamoDB Local");
    return true;
  } catch (error) {
    console.error("✗ Failed to connect to DynamoDB Local");
    console.error("  Make sure DynamoDB Local is running:");
    console.error("  docker-compose up -d dynamodb-local");
    console.error("");
    console.error("  Error:", error.message);
    return false;
  }
}

async function tableExists() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    return true;
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      return false;
    }
    throw error;
  }
}

async function createTable() {
  console.log(`Creating table: ${TABLE_NAME}...`);

  const createTableCommand = new CreateTableCommand({
    TableName: TABLE_NAME,
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "GSI1PK", AttributeType: "S" },
      { AttributeName: "GSI1SK", AttributeType: "S" },
      { AttributeName: "GSI2PK", AttributeType: "S" },
      { AttributeName: "GSI2SK", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "GSI1",
        KeySchema: [
          { AttributeName: "GSI1PK", KeyType: "HASH" },
          { AttributeName: "GSI1SK", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "GSI2",
        KeySchema: [
          { AttributeName: "GSI2PK", KeyType: "HASH" },
          { AttributeName: "GSI2SK", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  });

  try {
    await client.send(createTableCommand);
    console.log(`✓ Table ${TABLE_NAME} created successfully`);
    console.log("");
    console.log("Table Details:");
    console.log("  - Primary Key: PK (partition key), SK (sort key)");
    console.log("  - GSI1: GSI1PK, GSI1SK (for alternate access patterns)");
    console.log("  - GSI2: GSI2PK, GSI2SK (for role-based queries)");
    console.log("  - Billing Mode: PAY_PER_REQUEST");
    return true;
  } catch (error) {
    console.error(`✗ Failed to create table: ${error.message}`);
    return false;
  }
}

async function setupTable() {
  console.log("=".repeat(60));
  console.log("DynamoDB Local Setup for HackaGallery");
  console.log("=".repeat(60));
  console.log("");

  // Check connection
  const connected = await checkConnection();
  if (!connected) {
    process.exit(1);
  }

  console.log("");

  // Check if table exists
  const exists = await tableExists();
  if (exists) {
    console.log(`✓ Table ${TABLE_NAME} already exists`);
    console.log("");
    console.log("To recreate the table:");
    console.log("  1. Delete the table manually or restart DynamoDB Local");
    console.log("  2. Run this script again");
    console.log("");
    console.log("Your local development environment is ready!");
    return;
  }

  // Create table
  const created = await createTable();
  if (!created) {
    process.exit(1);
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("Setup Complete!");
  console.log("=".repeat(60));
  console.log("");
  console.log("Next steps:");
  console.log("  1. Configure your .env.local file:");
  console.log("     DYNAMODB_ENDPOINT=http://localhost:8000");
  console.log("     DYNAMODB_TABLE_NAME=hackagallery-local");
  console.log("     AWS_REGION=us-west-2");
  console.log("");
  console.log("  2. (Optional) Seed with sample data:");
  console.log("     npm run seed:local");
  console.log("");
  console.log("  3. Start your Next.js application:");
  console.log("     npm run dev");
  console.log("");
}

// Run setup
setupTable().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
