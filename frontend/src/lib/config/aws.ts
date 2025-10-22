/**
 * AWS Configuration Module
 *
 * Manages AWS configuration for DynamoDB access across different environments:
 * - Local development with DynamoDB Local
 * - AWS Amplify deployment with IAM compute roles
 * - Vercel/Netlify deployment with AWS credentials
 */

export interface AWSConfig {
  region: string;
  tableName: string;
  endpoint?: string; // For local development with DynamoDB Local
}

/**
 * Retrieves AWS configuration from environment variables with validation and fallbacks.
 *
 * SECURITY: This function must ONLY be called from server-side code.
 * AWS credentials and configuration should never be exposed to the browser.
 *
 * Environment Variables (SERVER-SIDE ONLY):
 * - HACKAGALLERY_AWS_REGION: AWS region (for Vercel and Netlify, since AWS_* is reserved)
 * - AWS_REGION: AWS region (for other platforms)
 * - DYNAMODB_TABLE_NAME: DynamoDB table name (required, server-side only)
 * - DYNAMODB_ENDPOINT: Local DynamoDB endpoint (optional, for development)
 *
 * @throws {Error} If called from browser or if required configuration is missing
 * @returns {AWSConfig} Validated AWS configuration object
 */
export function getAWSConfig(): AWSConfig {
  // SECURITY: Prevent client-side access to AWS configuration
  if (typeof window !== "undefined") {
    throw new Error(
      "AWS configuration must not be accessed from browser. " +
        "This function can only be called from server-side code (API routes, Server Components, etc.). " +
        "Use API routes to access AWS resources from client components."
    );
  }

  // Read region with custom prefix for Vercel and Netlify compatibility
  // Vercel and Netlify reserves AWS_REGION, so we check HACKAGALLERY_AWS_REGION first
  const region =
    process.env.HACKAGALLERY_AWS_REGION ||
    process.env.AWS_REGION ||
    "us-west-2";

  // Read table name (required) - SERVER-SIDE ONLY
  const tableName = process.env.DYNAMODB_TABLE_NAME;

  // Read optional endpoint for local development - SERVER-SIDE ONLY
  const endpoint = process.env.DYNAMODB_ENDPOINT;

  // Validate required configuration
  if (!tableName) {
    throw new Error(
      "DYNAMODB_TABLE_NAME environment variable is required. " +
        "This must be set as a server-side environment variable (without NEXT_PUBLIC_ prefix). " +
        "AWS credentials and table names should never be exposed to the browser."
    );
  }

  const config: AWSConfig = {
    region,
    tableName,
  };

  // Only include endpoint if it's set (for local development)
  if (endpoint) {
    config.endpoint = endpoint;
  }

  return config;
}

/**
 * DynamoDB Client Singleton Management
 *
 * Provides singleton instances of DynamoDB clients with connection pooling,
 * retry logic, and proper configuration for different environments.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Singleton instances
let dynamoDBClient: DynamoDBClient | null = null;
let documentClient: DynamoDBDocumentClient | null = null;

/**
 * Gets or creates a singleton DynamoDB client instance.
 *
 * Features:
 * - Connection pooling for efficient resource usage
 * - Automatic retry with exponential backoff (3 attempts)
 * - Support for local DynamoDB endpoint
 * - Uses AWS SDK default credential provider chain
 *
 * Credential Resolution Order:
 * 1. Custom environment variables (HACKAGALLERY_AWS_ACCESS_KEY_ID, HACKAGALLERY_AWS_SECRET_ACCESS_KEY)
 *    - Required for Vercel or Netlify deployment (AWS_* vars are reserved)
 * 2. Standard AWS environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 *    - For local development and other platforms
 * 3. IAM roles (for AWS Amplify SSR)
 * 4. AWS CLI credentials (~/.aws/credentials)
 *
 * @param {AWSConfig} config - AWS configuration object
 * @returns {DynamoDBClient} Singleton DynamoDB client instance
 */
export function getDynamoDBClient(config: AWSConfig): DynamoDBClient {
  if (!dynamoDBClient) {
    const clientConfig: {
      region: string;
      maxAttempts: number;
      endpoint?: string;
      credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
      };
    } = {
      region: config.region,
      maxAttempts: 3, // Retry failed requests up to 3 times
    };

    // Add endpoint for local development
    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
      // For local development, provide dummy credentials
      if (
        config.endpoint.includes("localhost") ||
        config.endpoint.includes("127.0.0.1")
      ) {
        clientConfig.credentials = {
          accessKeyId: "local",
          secretAccessKey: "local",
        };
      }
    } else {
      // For production deployments, check for custom credential env vars
      // Vercel and Netlify reserve AWS_*, so we use HACKAGALLERY_* prefix
      const customAccessKeyId = process.env.HACKAGALLERY_AWS_ACCESS_KEY_ID;
      const customSecretAccessKey =
        process.env.HACKAGALLERY_AWS_SECRET_ACCESS_KEY;

      if (customAccessKeyId && customSecretAccessKey) {
        clientConfig.credentials = {
          accessKeyId: customAccessKeyId,
          secretAccessKey: customSecretAccessKey,
        };
      }
      // If custom vars not set, AWS SDK will use default credential chain
      // (standard AWS_* env vars, IAM roles, or ~/.aws/credentials)
    }

    dynamoDBClient = new DynamoDBClient(clientConfig);
  }

  return dynamoDBClient;
}

/**
 * Gets or creates a singleton DynamoDB Document Client instance.
 *
 * The Document Client provides a higher-level abstraction that:
 * - Automatically marshalls/unmarshalls JavaScript objects to DynamoDB format
 * - Removes undefined values to prevent errors
 * - Converts class instances to plain objects
 *
 * Features:
 * - Built on top of the base DynamoDB client (inherits retry logic)
 * - Optimized marshalling options for JavaScript/TypeScript
 * - Singleton pattern for connection pooling
 *
 * @param {AWSConfig} config - AWS configuration object
 * @returns {DynamoDBDocumentClient} Singleton Document Client instance
 */
export function getDocumentClient(config: AWSConfig): DynamoDBDocumentClient {
  if (!documentClient) {
    const client = getDynamoDBClient(config);

    documentClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        // Remove undefined values to prevent DynamoDB errors
        removeUndefinedValues: true,
        // Convert class instances to plain objects
        convertClassInstanceToMap: true,
      },
      unmarshallOptions: {
        // Keep numbers as JavaScript numbers (not BigInt)
        wrapNumbers: false,
      },
    });
  }

  return documentClient;
}

/**
 * Validates security configuration to ensure sensitive variables are not exposed to the browser.
 *
 * This function scans environment variables for potential security violations:
 * - NEXT_PUBLIC_ prefixed variables that contain AWS credentials or secrets
 * - Accidentally exposed sensitive configuration
 *
 * @throws {Error} If security violations are detected
 */
export function validateSecurityConfiguration(): void {
  // Check for accidentally exposed sensitive variables with NEXT_PUBLIC_ prefix
  const exposedVars = Object.keys(process.env).filter(
    (key) =>
      key.startsWith("NEXT_PUBLIC_") &&
      (key.includes("AWS_ACCESS_KEY") ||
        key.includes("AWS_SECRET") ||
        key.includes("DYNAMODB_TABLE_NAME") ||
        key.includes("DYNAMODB_ENDPOINT") ||
        key.includes("SECRET") ||
        key.includes("PRIVATE_KEY") ||
        key.includes("API_KEY"))
  );

  if (exposedVars.length > 0) {
    throw new Error(
      `Security violation: Sensitive variables exposed to browser with NEXT_PUBLIC_ prefix: ${exposedVars.join(
        ", "
      )}. ` +
        "Remove NEXT_PUBLIC_ prefix from these variables to keep them server-side only. " +
        "AWS credentials and sensitive configuration should never be accessible from the browser."
    );
  }

  // Additional check for common AWS credential patterns
  const awsCredentialVars = Object.keys(process.env).filter(
    (key) =>
      key.startsWith("NEXT_PUBLIC_") &&
      (key.includes("AKIA") || key.includes("ASIA")) // AWS Access Key patterns
  );

  if (awsCredentialVars.length > 0) {
    throw new Error(
      `Security violation: AWS credentials detected in browser-accessible variables: ${awsCredentialVars.join(
        ", "
      )}. ` + "AWS credentials must never be exposed to the browser."
    );
  }
}

/**
 * Resets the singleton instances.
 * Useful for testing or when configuration changes require new clients.
 *
 * @internal
 */
export function resetClients(): void {
  if (documentClient) {
    documentClient.destroy();
    documentClient = null;
  }
  if (dynamoDBClient) {
    dynamoDBClient.destroy();
    dynamoDBClient = null;
  }
}
