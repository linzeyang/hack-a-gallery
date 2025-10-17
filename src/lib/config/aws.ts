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
 * Environment Variables:
 * - AWS_REGION or NEXT_PUBLIC_AWS_REGION: AWS region (default: us-east-1)
 * - DYNAMODB_TABLE_NAME or NEXT_PUBLIC_DYNAMODB_TABLE_NAME: DynamoDB table name (required)
 * - DYNAMODB_ENDPOINT or NEXT_PUBLIC_DYNAMODB_ENDPOINT: Local DynamoDB endpoint (optional)
 *
 * @throws {Error} If required configuration (table name) is missing
 * @returns {AWSConfig} Validated AWS configuration object
 */
export function getAWSConfig(): AWSConfig {
  // Read region with fallback to us-east-1
  const region =
    process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || "us-west-2";

  // Read table name (required)
  const tableName =
    process.env.DYNAMODB_TABLE_NAME ||
    process.env.NEXT_PUBLIC_DYNAMODB_TABLE_NAME;

  // Read optional endpoint for local development
  const endpoint =
    process.env.DYNAMODB_ENDPOINT || process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT;

  // Validate required configuration
  if (!tableName) {
    throw new Error(
      "DYNAMODB_TABLE_NAME environment variable is required. " +
        "Please set DYNAMODB_TABLE_NAME or NEXT_PUBLIC_DYNAMODB_TABLE_NAME in your environment."
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
