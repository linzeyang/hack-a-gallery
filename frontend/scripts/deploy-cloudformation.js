#!/usr/bin/env node

/**
 * CloudFormation Deployment Script for HackaGallery DynamoDB Table
 *
 * This script deploys the DynamoDB table using AWS CloudFormation.
 * It handles parameter validation, stack creation/update, and outputs
 * the table name and ARN upon successful deployment.
 *
 * Usage:
 *   node scripts/deploy-cloudformation.js [environment] [region]
 *
 * Examples:
 *   node scripts/deploy-cloudformation.js dev us-west-2
 *   node scripts/deploy-cloudformation.js prod us-west-2
 */

import {
  CloudFormationClient,
  CreateStackCommand,
  UpdateStackCommand,
  DescribeStacksCommand,
  waitUntilStackCreateComplete,
  waitUntilStackUpdateComplete,
} from "@aws-sdk/client-cloudformation";
import { readFileSync } from "fs";
import { join } from "path";

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args[0] || "dev";
const region = args[1] || process.env.AWS_REGION || "us-west-2";

// Validate environment
const validEnvironments = ["dev", "staging", "prod"];
if (!validEnvironments.includes(environment)) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.error(`   Valid options: ${validEnvironments.join(", ")}`);
  process.exit(1);
}

// Configuration
const stackName = `hackagallery-dynamodb-${environment}`;
const templatePath = join(
  __dirname,
  "../infrastructure/cloudformation/dynamodb-table.yaml"
);

// Initialize CloudFormation client
const cfnClient = new CloudFormationClient({ region });

/**
 * Read the CloudFormation template file
 */
function readTemplate() {
  try {
    return readFileSync(templatePath, "utf-8");
  } catch (error) {
    console.error(`❌ Failed to read template file: ${templatePath}`);
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Check if a CloudFormation stack exists
 */
async function stackExists(stackName) {
  try {
    const command = new DescribeStacksCommand({ StackName: stackName });
    const response = await cfnClient.send(command);
    const stack = response.Stacks?.[0];

    // Stack exists if it's not in a deleted state
    return stack && !stack.StackStatus.includes("DELETE_COMPLETE");
  } catch (error) {
    if (
      error.name === "ValidationError" &&
      error.message.includes("does not exist")
    ) {
      return false;
    }
    throw error;
  }
}

/**
 * Create a new CloudFormation stack
 */
async function createStack(templateBody) {
  console.log(`📦 Creating stack: ${stackName}`);
  console.log(`   Region: ${region}`);
  console.log(`   Environment: ${environment}`);

  const command = new CreateStackCommand({
    StackName: stackName,
    TemplateBody: templateBody,
    Parameters: [
      {
        ParameterKey: "Environment",
        ParameterValue: environment,
      },
    ],
    Tags: [
      { Key: "Application", Value: "HackaGallery" },
      { Key: "Environment", Value: environment },
      { Key: "ManagedBy", Value: "CloudFormation" },
    ],
    Capabilities: ["CAPABILITY_IAM"],
  });

  try {
    const response = await cfnClient.send(command);
    console.log(`✅ Stack creation initiated`);
    console.log(`   Stack ID: ${response.StackId}`);
    return response.StackId;
  } catch (error) {
    console.error(`❌ Failed to create stack: ${error.message}`);
    throw error;
  }
}

/**
 * Update an existing CloudFormation stack
 */
async function updateStack(templateBody) {
  console.log(`🔄 Updating stack: ${stackName}`);
  console.log(`   Region: ${region}`);
  console.log(`   Environment: ${environment}`);

  const command = new UpdateStackCommand({
    StackName: stackName,
    TemplateBody: templateBody,
    Parameters: [
      {
        ParameterKey: "Environment",
        ParameterValue: environment,
      },
    ],
    Tags: [
      { Key: "Application", Value: "HackaGallery" },
      { Key: "Environment", Value: environment },
      { Key: "ManagedBy", Value: "CloudFormation" },
    ],
    Capabilities: ["CAPABILITY_IAM"],
  });

  try {
    const response = await cfnClient.send(command);
    console.log(`✅ Stack update initiated`);
    console.log(`   Stack ID: ${response.StackId}`);
    return response.StackId;
  } catch (error) {
    if (error.message.includes("No updates are to be performed")) {
      console.log(`ℹ️  No changes detected - stack is already up to date`);
      return null;
    }
    console.error(`❌ Failed to update stack: ${error.message}`);
    throw error;
  }
}

/**
 * Wait for stack operation to complete
 */
async function waitForStack(stackName, operation) {
  console.log(`⏳ Waiting for ${operation} to complete...`);
  console.log(`   This may take a few minutes`);

  const startTime = Date.now();

  try {
    if (operation === "create") {
      await waitUntilStackCreateComplete(
        { client: cfnClient, maxWaitTime: 600 },
        { StackName: stackName }
      );
    } else if (operation === "update") {
      await waitUntilStackUpdateComplete(
        { client: cfnClient, maxWaitTime: 600 },
        { StackName: stackName }
      );
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ Stack ${operation} completed successfully (${duration}s)`);
  } catch (error) {
    console.error(`❌ Stack ${operation} failed or timed out`);
    throw error;
  }
}

/**
 * Get and display stack outputs
 */
async function displayOutputs(stackName) {
  try {
    const command = new DescribeStacksCommand({ StackName: stackName });
    const response = await cfnClient.send(command);
    const stack = response.Stacks?.[0];

    if (!stack) {
      console.error(`❌ Stack not found: ${stackName}`);
      return;
    }

    console.log("\n📋 Stack Outputs:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (stack.Outputs && stack.Outputs.length > 0) {
      stack.Outputs.forEach((output) => {
        console.log(`   ${output.OutputKey}: ${output.OutputValue}`);
        if (output.Description) {
          console.log(`   └─ ${output.Description}`);
        }
      });
    } else {
      console.log("   No outputs available");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Extract table name for environment variable
    const tableNameOutput = stack.Outputs?.find(
      (o) => o.OutputKey === "TableName"
    );
    if (tableNameOutput) {
      console.log("\n💡 Environment Variable Configuration:");
      console.log(`   DYNAMODB_TABLE_NAME=${tableNameOutput.OutputValue}`);
      console.log(`   AWS_REGION=${region}`);
    }

    return stack.Outputs;
  } catch (error) {
    console.error(`❌ Failed to retrieve stack outputs: ${error.message}`);
    throw error;
  }
}

/**
 * Main deployment function
 */
async function deploy() {
  console.log("🚀 HackaGallery DynamoDB Deployment");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Read template
    const templateBody = readTemplate();

    // Check if stack exists
    const exists = await stackExists(stackName);

    let stackId;
    let operation;

    if (exists) {
      // Update existing stack
      stackId = await updateStack(templateBody);
      operation = "update";

      // If no updates needed, just display current outputs
      if (!stackId) {
        await displayOutputs(stackName);
        console.log("\n✨ Deployment complete - no changes needed\n");
        return;
      }
    } else {
      // Create new stack
      stackId = await createStack(templateBody);
      operation = "create";
    }

    // Wait for operation to complete
    await waitForStack(stackName, operation);

    // Display outputs
    await displayOutputs(stackName);

    console.log("\n✨ Deployment complete!\n");
    console.log("📝 Next Steps:");
    console.log(
      "   1. Copy the environment variables above to your deployment platform"
    );
    console.log(
      "   2. Configure IAM permissions (see infrastructure/iam/README.md)"
    );
    console.log(
      "   3. Deploy your application with the new environment variables\n"
    );
  } catch (error) {
    console.error("\n❌ Deployment failed");
    console.error(`   Error: ${error.message}`);

    if (error.code === "CredentialsProviderError") {
      console.error("\n💡 Tip: Make sure AWS credentials are configured");
      console.error("   Run: aws configure");
    }

    process.exit(1);
  }
}

// Run deployment
deploy();
