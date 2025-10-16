import type { IStorageAdapter } from "@/lib/types/storage";
import { LocalStorageAdapter } from "@/lib/adapters/localStorageAdapter";
import { DynamoDBAdapter } from "@/lib/adapters/dynamoDBAdapter";
import { getAWSConfig } from "@/lib/config/aws";

/**
 * Storage Factory
 *
 * Returns the appropriate storage adapter based on environment configuration.
 *
 * Returns DynamoDBAdapter by default for cloud-based storage with SSR support.
 * Can fall back to LocalStorageAdapter for backward compatibility.
 *
 * ARCHITECTURAL BENEFITS:
 * =======================
 * - DynamoDB adapter works in both SSR and client-side contexts
 * - Pages can be Server Components for better performance and SEO
 * - Persistent, scalable cloud storage
 * - Multi-platform deployment support (AWS Amplify, Vercel, Netlify)
 *
 * ENVIRONMENT VARIABLES:
 * ======================
 * - NEXT_PUBLIC_USE_LOCALSTORAGE: Set to "true" to use localStorage (backward compatibility)
 * - DYNAMODB_TABLE_NAME: DynamoDB table name (required for DynamoDB adapter)
 * - AWS_REGION: AWS region (default: us-east-1)
 * - DYNAMODB_ENDPOINT: Local DynamoDB endpoint for development (optional)
 *
 * ADAPTER SELECTION:
 * ==================
 * 1. If NEXT_PUBLIC_USE_LOCALSTORAGE=true AND in browser → LocalStorageAdapter
 * 2. Otherwise → DynamoDBAdapter (default)
 *
 * The service layer (eventService, projectService) remains unchanged - only the
 * storage adapter implementation changes based on environment configuration.
 *
 * @returns IStorageAdapter instance
 */
export function getStorageAdapter(): IStorageAdapter {
  // Check if we should use localStorage for backward compatibility
  const useLocalStorage = process.env.NEXT_PUBLIC_USE_LOCALSTORAGE === "true";

  if (useLocalStorage && typeof window !== "undefined") {
    // Backward compatibility: Use localStorage in browser environment
    return new LocalStorageAdapter();
  }

  // Default: Use DynamoDB adapter for cloud storage with SSR support
  const config = getAWSConfig();
  return new DynamoDBAdapter(config);
}
