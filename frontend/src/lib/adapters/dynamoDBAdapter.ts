/**
 * DynamoDB Storage Adapter
 *
 * Implements the IStorageAdapter interface using Amazon DynamoDB as the backend.
 * Provides persistent, scalable cloud storage with support for Server-Side Rendering.
 *
 * Key Features:
 * - Single-table design with composite keys (PK, SK)
 * - Global Secondary Indexes (GSI1, GSI2) for alternate access patterns
 * - Automatic timestamp management (createdAt, updatedAt)
 * - Retry logic with exponential backoff for throttling
 * - Connection pooling via singleton Document Client
 *
 * Key Patterns:
 * - Events: PK="EVENT#{eventId}", SK="METADATA"
 * - Projects: PK="EVENT#{eventId}", SK="PROJECT#{projectId}"
 * - Prize Awards: PK="EVENT#{eventId}", SK="PRIZE-AWARD#{prizeId}#{projectId}"
 * - Users: PK="USER#{userId}", SK="METADATA"
 */

import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import type { IStorageAdapter } from "@/lib/types/storage";
import type { AWSConfig } from "@/lib/config/aws";
import { getDocumentClient } from "@/lib/config/aws";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * DynamoDB item with partition and sort keys
 */
interface DynamoDBItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  entityType?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/**
 * DynamoDB Storage Adapter Implementation
 */
export class DynamoDBAdapter implements IStorageAdapter {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  /**
   * Creates a new DynamoDB adapter instance
   *
   * @param config - AWS configuration (region, table name, optional endpoint)
   */
  constructor(config: AWSConfig) {
    this.docClient = getDocumentClient(config);
    this.tableName = config.tableName;
  }

  /**
   * Retrieve an item from DynamoDB by key
   *
   * @param key - Storage key in format "entityType:id" or "entityType:parentId:childId"
   * @returns Promise resolving to the item or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      this.log("info", `Getting item with key: ${key}`);

      // Parse key into PK and SK
      const { PK, SK } = this.parseKey(key);

      // Execute GetCommand with retry logic
      const result = await this.executeWithRetry(async () => {
        const command = new GetCommand({
          TableName: this.tableName,
          Key: { PK, SK },
        });

        return await this.docClient.send(command);
      });

      // Return item or null if not found
      if (!result.Item) {
        this.log("info", `Item not found with key: ${key}`, { PK, SK });
        return null;
      }

      // Remove DynamoDB-specific keys before returning
      const item = { ...result.Item };
      delete item.PK;
      delete item.SK;
      delete item.GSI1PK;
      delete item.GSI1SK;
      delete item.GSI2PK;
      delete item.GSI2SK;
      delete item.entityType;

      this.log("info", `Successfully retrieved item with key: ${key}`, {
        PK,
        SK,
      });

      return item as T;
    } catch (error) {
      this.log("error", `Failed to get item with key: ${key}`, {
        error,
        operation: "get",
      });
      throw error;
    }
  }

  /**
   * Store an item in DynamoDB
   *
   * @param key - Storage key in format "entityType:id" or "entityType:parentId:childId"
   * @param value - Item to store
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      this.log("info", `Storing item with key: ${key}`);

      // Parse key into PK and SK
      const { PK, SK } = this.parseKey(key);

      // Convert value to a plain object
      const item = { ...(value as Record<string, unknown>) };

      // Check if this is an update (item has createdAt) or new item
      const isUpdate = !!item.createdAt;

      // Add/update timestamps
      const now = new Date().toISOString();
      if (!isUpdate) {
        item.createdAt = now;
      }
      item.updatedAt = now;

      // Generate GSI keys based on entity type
      const gsiKeys = this.generateGSIKeys(item, PK, SK);

      // Determine entity type for storage
      let entityType = "Unknown";
      if (PK.startsWith("EVENT#") && SK === "METADATA") {
        entityType = "Event";
      } else if (PK.startsWith("EVENT#") && SK.startsWith("PROJECT#")) {
        entityType = "Project";
      } else if (PK.startsWith("EVENT#") && SK.startsWith("PRIZE-AWARD#")) {
        entityType = "PrizeAward";
      } else if (PK.startsWith("USER#")) {
        entityType = "User";
      }

      // Build the complete DynamoDB item
      const dynamoDBItem: DynamoDBItem = {
        PK,
        SK,
        ...gsiKeys,
        entityType,
        ...item,
      };

      this.log("info", `Executing PutCommand for key: ${key}`, {
        PK,
        SK,
        entityType,
        isUpdate,
        hasGSI1: !!gsiKeys.GSI1PK,
        hasGSI2: !!gsiKeys.GSI2PK,
      });

      // Execute PutCommand with retry logic
      await this.executeWithRetry(async () => {
        const command = new PutCommand({
          TableName: this.tableName,
          Item: dynamoDBItem,
        });

        await this.docClient.send(command);
      });

      this.log("info", `Successfully stored item with key: ${key}`, {
        PK,
        SK,
        entityType,
        isUpdate,
      });
    } catch (error) {
      this.log("error", `Failed to store item with key: ${key}`, {
        error,
        operation: "set",
      });
      throw error;
    }
  }

  /**
   * Remove an item from DynamoDB
   *
   * @param key - Storage key in format "entityType:id" or "entityType:parentId:childId"
   */
  async remove(key: string): Promise<void> {
    try {
      this.log("info", `Removing item with key: ${key}`);

      // Parse key into PK and SK
      const { PK, SK } = this.parseKey(key);

      // Execute DeleteCommand with retry logic
      await this.executeWithRetry(async () => {
        const command = new DeleteCommand({
          TableName: this.tableName,
          Key: { PK, SK },
        });

        await this.docClient.send(command);
      });

      this.log("info", `Successfully removed item with key: ${key}`, {
        PK,
        SK,
      });
    } catch (error) {
      this.log("error", `Failed to remove item with key: ${key}`, {
        error,
        operation: "remove",
      });
      throw error;
    }
  }

  /**
   * Clear all items from the DynamoDB table
   *
   * WARNING: This operation deletes all data in the table.
   * Use with caution, primarily for testing purposes.
   */
  async clear(): Promise<void> {
    try {
      this.log("warn", "Starting clear operation - all items will be deleted");

      // Scan all items to get their keys
      const keysToDelete: Array<{ PK: string; SK: string }> = [];
      let lastEvaluatedKey: Record<string, unknown> | undefined;

      do {
        const result = await this.executeWithRetry(async () => {
          const command = new ScanCommand({
            TableName: this.tableName,
            ProjectionExpression: "PK, SK",
            ExclusiveStartKey: lastEvaluatedKey,
          });

          return await this.docClient.send(command);
        });

        if (result.Items) {
          for (const item of result.Items) {
            keysToDelete.push({
              PK: item.PK as string,
              SK: item.SK as string,
            });
          }
        }

        lastEvaluatedKey = result.LastEvaluatedKey;
      } while (lastEvaluatedKey);

      this.log("info", `Found ${keysToDelete.length} items to delete`);

      // Batch delete items (DynamoDB allows max 25 items per batch)
      const batchSize = 25;
      for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batch = keysToDelete.slice(i, i + batchSize);

        await this.executeWithRetry(async () => {
          const command = new BatchWriteCommand({
            RequestItems: {
              [this.tableName]: batch.map((key) => ({
                DeleteRequest: {
                  Key: key,
                },
              })),
            },
          });

          await this.docClient.send(command);
        });

        this.log("info", `Deleted batch ${Math.floor(i / batchSize) + 1}`, {
          itemsDeleted: batch.length,
        });
      }

      this.log("info", "Clear operation completed successfully", {
        totalItemsDeleted: keysToDelete.length,
      });
    } catch (error) {
      this.log("error", "Failed to clear table", { error });
      throw error;
    }
  }

  /**
   * Retrieve all items matching a key prefix
   *
   * @param prefix - Key prefix to filter by (e.g., "event:", "project:evt_123:")
   * @returns Promise resolving to array of matching items
   */
  async getAll<T>(prefix: string): Promise<T[]> {
    try {
      this.log("info", `Getting all items with prefix: ${prefix}`);

      const items: T[] = [];

      // Determine query strategy based on prefix
      const parts = prefix.split(":");

      if (parts.length < 1) {
        throw new Error(`Invalid prefix format: "${prefix}"`);
      }

      const entityType = parts[0].toLowerCase();

      // Strategy 1: Entity-level queries (e.g., "event:", "user:")
      // Use Scan with filter expression
      if (parts.length === 1 || (parts.length === 2 && parts[1] === "")) {
        let pkPrefix: string;

        switch (entityType) {
          case "event":
            pkPrefix = "EVENT#";
            break;
          case "user":
            pkPrefix = "USER#";
            break;
          case "project":
            // Projects need parent event ID, can't query all projects globally
            throw new Error(
              'Cannot query all projects without event ID. Use "project:eventId:" format.'
            );
          default:
            throw new Error(`Unknown entity type: "${entityType}"`);
        }

        this.log("info", `Using Scan strategy for entity-level query`, {
          prefix,
          pkPrefix,
          entityType,
        });

        // Use Scan with begins_with filter
        await this.scanWithPagination(pkPrefix, "METADATA", items);
      }
      // Strategy 2: Parent-child queries (e.g., "project:evt_123:")
      // Use Query with PK
      else if (parts.length === 2 || (parts.length === 3 && parts[2] === "")) {
        if (entityType === "project") {
          const eventId = parts[1];
          const PK = `EVENT#${eventId}`;
          const skPrefix = "PROJECT#";

          this.log("info", `Using Query strategy for parent-child query`, {
            prefix,
            PK,
            skPrefix,
            entityType,
          });

          // Use Query with PK and SK begins_with
          await this.queryWithPagination(PK, skPrefix, items);
        } else if (entityType === "prize-award") {
          // prize-award:evt_123: → All awards for event
          const eventId = parts[1];
          const PK = `EVENT#${eventId}`;
          const skPrefix = "PRIZE-AWARD#";

          this.log("info", `Using Query strategy for prize-award event query`, {
            prefix,
            PK,
            skPrefix,
            entityType,
          });

          // Use Query with PK and SK begins_with
          await this.queryWithPagination(PK, skPrefix, items);
        } else {
          throw new Error(
            `Unsupported prefix format for ${entityType}: "${prefix}"`
          );
        }
      }
      // Strategy 3: Prize-award specific prize queries (e.g., "prize-award:evt_123:prize_1:")
      else if (parts.length === 3 || (parts.length === 4 && parts[3] === "")) {
        if (entityType === "prize-award") {
          // prize-award:evt_123:prize_1: → All awards for specific prize
          const eventId = parts[1];
          const prizeId = parts[2];
          const PK = `EVENT#${eventId}`;
          const skPrefix = `PRIZE-AWARD#${prizeId}#`;

          this.log("info", `Using Query strategy for prize-award prize query`, {
            prefix,
            PK,
            skPrefix,
            entityType,
          });

          // Use Query with PK and SK begins_with
          await this.queryWithPagination(PK, skPrefix, items);
        } else {
          throw new Error(
            `Unsupported prefix format for ${entityType}: "${prefix}"`
          );
        }
      } else {
        throw new Error(`Invalid prefix format: "${prefix}"`);
      }

      this.log(
        "info",
        `Retrieved ${items.length} items with prefix: ${prefix}`,
        {
          itemCount: items.length,
          entityType,
        }
      );
      return items;
    } catch (error) {
      this.log("error", `Failed to get all items with prefix: ${prefix}`, {
        error,
        operation: "getAll",
      });
      throw error;
    }
  }

  /**
   * Query items using a Global Secondary Index (GSI)
   *
   * Optimized for querying items by alternate access patterns without scanning.
   * Example: Get all prize awards for a specific project using GSI1.
   *
   * @param gsiName - Name of the GSI to query (e.g., "GSI1", "GSI2")
   * @param partitionKey - GSI partition key value (e.g., "PROJECT#proj_123")
   * @param sortKeyPrefix - Optional GSI sort key prefix for filtering (e.g., "PRIZE-AWARD#")
   * @returns Promise resolving to array of matching items
   */
  async queryGSI<T>(
    gsiName: string,
    partitionKey: string,
    sortKeyPrefix?: string
  ): Promise<T[]> {
    try {
      this.log(
        "info",
        `Querying ${gsiName} with partition key: ${partitionKey}`,
        {
          sortKeyPrefix,
        }
      );

      const items: T[] = [];
      let lastEvaluatedKey: Record<string, unknown> | undefined;

      // Build query parameters
      const queryParams: {
        TableName: string;
        IndexName: string;
        KeyConditionExpression: string;
        ExpressionAttributeNames: Record<string, string>;
        ExpressionAttributeValues: Record<string, string>;
        ExclusiveStartKey?: Record<string, unknown>;
      } = {
        TableName: this.tableName,
        IndexName: gsiName,
        KeyConditionExpression: sortKeyPrefix
          ? "#pk = :pk AND begins_with(#sk, :sk)"
          : "#pk = :pk",
        ExpressionAttributeNames: {
          "#pk": `${gsiName}PK`,
          ...(sortKeyPrefix && { "#sk": `${gsiName}SK` }),
        },
        ExpressionAttributeValues: {
          ":pk": partitionKey,
          ...(sortKeyPrefix && { ":sk": sortKeyPrefix }),
        },
      };

      // Paginate through results
      do {
        if (lastEvaluatedKey) {
          queryParams.ExclusiveStartKey = lastEvaluatedKey;
        }

        const result = await this.executeWithRetry(async () => {
          const command = new QueryCommand(queryParams);
          return await this.docClient.send(command);
        });

        if (result.Items) {
          for (const item of result.Items) {
            // Remove DynamoDB-specific keys
            const cleanItem = { ...item };
            delete cleanItem.PK;
            delete cleanItem.SK;
            delete cleanItem.GSI1PK;
            delete cleanItem.GSI1SK;
            delete cleanItem.GSI2PK;
            delete cleanItem.GSI2SK;
            delete cleanItem.entityType;

            items.push(cleanItem as T);
          }
        }

        lastEvaluatedKey = result.LastEvaluatedKey;
      } while (lastEvaluatedKey);

      this.log("info", `Retrieved ${items.length} items from ${gsiName}`, {
        partitionKey,
        sortKeyPrefix,
        itemCount: items.length,
      });

      return items;
    } catch (error) {
      this.log("error", `Failed to query ${gsiName}`, {
        error,
        partitionKey,
        sortKeyPrefix,
        operation: "queryGSI",
      });
      throw error;
    }
  }

  /**
   * Parse a storage key into DynamoDB partition key (PK) and sort key (SK)
   *
   * Key Format Examples:
   * - "event:evt_123" → PK: "EVENT#evt_123", SK: "METADATA"
   * - "project:evt_123:proj_789" → PK: "EVENT#evt_123", SK: "PROJECT#proj_789"
   * - "prize-award:evt_123:prize_1:proj_456" → PK: "EVENT#evt_123", SK: "PRIZE-AWARD#prize_1#proj_456"
   * - "user:user_101" → PK: "USER#user_101", SK: "METADATA"
   *
   * @param key - Storage key in format "entityType:id" or "entityType:parentId:childId"
   * @returns Object with PK and SK properties
   * @throws Error if key format is invalid
   */
  private parseKey(key: string): { PK: string; SK: string } {
    const parts = key.split(":");

    if (parts.length < 2) {
      throw new Error(
        `Invalid key format: "${key}". Expected format: "entityType:id" or "entityType:parentId:childId"`
      );
    }

    const entityType = parts[0].toLowerCase();

    switch (entityType) {
      case "event":
        // event:evt_123 → PK: EVENT#evt_123, SK: METADATA
        if (parts.length === 2) {
          return {
            PK: `EVENT#${parts[1]}`,
            SK: "METADATA",
          };
        }
        throw new Error(
          `Invalid event key format: "${key}". Expected: "event:eventId"`
        );

      case "project":
        // project:evt_123:proj_789 → PK: EVENT#evt_123, SK: PROJECT#proj_789
        if (parts.length === 3) {
          return {
            PK: `EVENT#${parts[1]}`,
            SK: `PROJECT#${parts[2]}`,
          };
        }
        throw new Error(
          `Invalid project key format: "${key}". Expected: "project:eventId:projectId"`
        );

      case "user":
        // user:user_101 → PK: USER#user_101, SK: METADATA
        if (parts.length === 2) {
          return {
            PK: `USER#${parts[1]}`,
            SK: "METADATA",
          };
        }
        throw new Error(
          `Invalid user key format: "${key}". Expected: "user:userId"`
        );

      case "prize-award":
        // prize-award:evt_123:prize_1:proj_456 → PK: EVENT#evt_123, SK: PRIZE-AWARD#prize_1#proj_456
        if (parts.length === 4) {
          return {
            PK: `EVENT#${parts[1]}`,
            SK: `PRIZE-AWARD#${parts[2]}#${parts[3]}`,
          };
        }
        throw new Error(
          `Invalid prize-award key format: "${key}". Expected: "prize-award:eventId:prizeId:projectId"`
        );

      default:
        throw new Error(
          `Unknown entity type: "${entityType}". Supported types: event, project, user, prize-award`
        );
    }
  }

  /**
   * Build a storage key from DynamoDB partition key (PK) and sort key (SK)
   *
   * Reverse operation of parseKey()
   *
   * Examples:
   * - PK: "EVENT#evt_123", SK: "METADATA" → "event:evt_123"
   * - PK: "EVENT#evt_123", SK: "PROJECT#proj_789" → "project:evt_123:proj_789"
   * - PK: "EVENT#evt_123", SK: "PRIZE-AWARD#prize_1#proj_456" → "prize-award:evt_123:prize_1:proj_456"
   * - PK: "USER#user_101", SK: "METADATA" → "user:user_101"
   *
   * @param PK - DynamoDB partition key
   * @param SK - DynamoDB sort key
   * @returns Storage key string
   */
  private buildKey(PK: string, SK: string): string {
    // Extract entity type and ID from PK
    const pkParts = PK.split("#");
    if (pkParts.length !== 2) {
      throw new Error(`Invalid PK format: "${PK}"`);
    }

    const pkType = pkParts[0];
    const pkId = pkParts[1];

    // Handle different SK patterns
    if (SK === "METADATA") {
      // Event or User entity
      if (pkType === "EVENT") {
        return `event:${pkId}`;
      } else if (pkType === "USER") {
        return `user:${pkId}`;
      }
    } else if (SK.startsWith("PROJECT#")) {
      // Project entity
      const projectId = SK.substring(8); // Remove "PROJECT#" prefix
      return `project:${pkId}:${projectId}`;
    } else if (SK.startsWith("PRIZE-AWARD#")) {
      // Prize award entity
      // SK format: PRIZE-AWARD#prizeId#projectId
      const skParts = SK.split("#");
      if (skParts.length === 3) {
        const prizeId = skParts[1];
        const projectId = skParts[2];
        return `prize-award:${pkId}:${prizeId}:${projectId}`;
      }
      throw new Error(`Invalid PRIZE-AWARD SK format: "${SK}"`);
    }

    throw new Error(`Unable to build key from PK: "${PK}", SK: "${SK}"`);
  }

  /**
   * Generate GSI keys for an item based on entity type and attributes
   *
   * GSI1 Access Patterns:
   * - Events by organizer: GSI1PK="ORGANIZER#{organizerId}", GSI1SK="EVENT#{eventId}"
   * - Projects by hacker: GSI1PK="HACKER#{hackerId}", GSI1SK="PROJECT#{projectId}"
   * - Prize awards by project: GSI1PK="PROJECT#{projectId}", GSI1SK="PRIZE-AWARD#{prizeId}"
   * - Users by email: GSI1PK="EMAIL#{email}", GSI1SK="USER#{userId}"
   *
   * GSI2 Access Patterns:
   * - Users by role: GSI2PK="ROLE#{role}", GSI2SK="USER#{userId}"
   *
   * @param item - Item with entity data
   * @param PK - Partition key
   * @param SK - Sort key
   * @returns Partial DynamoDB item with GSI keys
   */
  private generateGSIKeys(
    item: Record<string, unknown>,
    PK: string,
    SK: string
  ): Partial<DynamoDBItem> {
    const gsiKeys: Partial<DynamoDBItem> = {};

    // Determine entity type from PK
    if (PK.startsWith("EVENT#") && SK === "METADATA") {
      // Event entity - GSI1 for organizer access
      const organizerId = item.organizerId as string | undefined;
      const eventId = item.id as string | undefined;

      if (organizerId && eventId) {
        gsiKeys.GSI1PK = `ORGANIZER#${organizerId}`;
        gsiKeys.GSI1SK = `EVENT#${eventId}`;
      }
    } else if (PK.startsWith("EVENT#") && SK.startsWith("PROJECT#")) {
      // Project entity - GSI1 for hacker access
      const hackerId = item.hackerId as string | undefined;
      const projectId = item.id as string | undefined;

      if (hackerId && projectId) {
        gsiKeys.GSI1PK = `HACKER#${hackerId}`;
        gsiKeys.GSI1SK = `PROJECT#${projectId}`;
      }
    } else if (PK.startsWith("EVENT#") && SK.startsWith("PRIZE-AWARD#")) {
      // Prize award entity - GSI1 for project access
      const projectId = item.projectId as string | undefined;
      const prizeId = item.prizeId as string | undefined;

      if (projectId && prizeId) {
        gsiKeys.GSI1PK = `PROJECT#${projectId}`;
        gsiKeys.GSI1SK = `PRIZE-AWARD#${prizeId}`;
      }
    } else if (PK.startsWith("USER#") && SK === "METADATA") {
      // User entity - GSI1 for email access, GSI2 for role access
      const email = item.email as string | undefined;
      const role = item.role as string | undefined;
      const userId = item.id as string | undefined;

      if (email && userId) {
        gsiKeys.GSI1PK = `EMAIL#${email}`;
        gsiKeys.GSI1SK = `USER#${userId}`;
      }

      if (role && userId) {
        gsiKeys.GSI2PK = `ROLE#${role}`;
        gsiKeys.GSI2SK = `USER#${userId}`;
      }
    }

    return gsiKeys;
  }

  /**
   * Execute a DynamoDB operation with retry logic and exponential backoff
   *
   * Handles transient errors like throttling and network issues by retrying
   * up to 3 times with exponential backoff (100ms, 200ms, 400ms).
   *
   * @param operation - Async function to execute
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Promise resolving to operation result
   * @throws Error if all retries are exhausted
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        const errorName = (error as { name?: string }).name;
        const errorMessage = (error as { message?: string }).message;
        const isRetryable =
          errorName === "ProvisionedThroughputExceededException" ||
          errorName === "ThrottlingException" ||
          errorName === "RequestLimitExceeded" ||
          errorName === "ServiceUnavailable" ||
          errorName === "InternalServerError" ||
          errorName === "NetworkingError" ||
          errorName === "TimeoutError";

        // Log the error with context
        this.log(
          "warn",
          `DynamoDB operation failed on attempt ${attempt + 1}`,
          {
            attempt: attempt + 1,
            maxRetries,
            errorName,
            errorMessage,
            isRetryable,
            stack: lastError.stack,
          }
        );

        // Don't retry on non-retryable errors
        if (!isRetryable) {
          this.log("error", "Non-retryable error encountered", {
            errorName,
            errorMessage,
            stack: lastError.stack,
          });
          throw error;
        }

        // Don't wait after the last attempt
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 100ms, 200ms, 400ms
          const delay = 100 * Math.pow(2, attempt);
          this.log("info", `Retrying operation after ${delay}ms`, {
            attempt: attempt + 1,
            maxRetries,
            delay,
            errorName,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted
    this.log("error", "All retry attempts exhausted", {
      maxRetries,
      errorName: lastError?.name,
      errorMessage: lastError?.message,
      stack: lastError?.stack,
    });
    throw lastError!;
  }

  /**
   * Query items with pagination support
   *
   * @param PK - Partition key to query
   * @param skPrefix - Sort key prefix for begins_with condition
   * @param items - Array to accumulate results
   */
  private async queryWithPagination<T>(
    PK: string,
    skPrefix: string,
    items: T[]
  ): Promise<void> {
    let lastEvaluatedKey: Record<string, unknown> | undefined;

    do {
      const result = await this.executeWithRetry(async () => {
        const command = new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
          ExpressionAttributeValues: {
            ":pk": PK,
            ":skPrefix": skPrefix,
          },
          ExclusiveStartKey: lastEvaluatedKey,
        });

        return await this.docClient.send(command);
      });

      if (result.Items) {
        // Remove DynamoDB-specific keys and add to results
        for (const item of result.Items) {
          const cleanItem = { ...item };
          delete cleanItem.PK;
          delete cleanItem.SK;
          delete cleanItem.GSI1PK;
          delete cleanItem.GSI1SK;
          delete cleanItem.GSI2PK;
          delete cleanItem.GSI2SK;
          delete cleanItem.entityType;
          items.push(cleanItem as T);
        }
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);
  }

  /**
   * Scan items with pagination support
   *
   * @param pkPrefix - Partition key prefix for begins_with filter
   * @param sk - Sort key value to match
   * @param items - Array to accumulate results
   */
  private async scanWithPagination<T>(
    pkPrefix: string,
    sk: string,
    items: T[]
  ): Promise<void> {
    let lastEvaluatedKey: Record<string, unknown> | undefined;

    do {
      const result = await this.executeWithRetry(async () => {
        const command = new ScanCommand({
          TableName: this.tableName,
          FilterExpression: "begins_with(PK, :pkPrefix) AND SK = :sk",
          ExpressionAttributeValues: {
            ":pkPrefix": pkPrefix,
            ":sk": sk,
          },
          ExclusiveStartKey: lastEvaluatedKey,
        });

        return await this.docClient.send(command);
      });

      if (result.Items) {
        // Remove DynamoDB-specific keys and add to results
        for (const item of result.Items) {
          const cleanItem = { ...item };
          delete cleanItem.PK;
          delete cleanItem.SK;
          delete cleanItem.GSI1PK;
          delete cleanItem.GSI1SK;
          delete cleanItem.GSI2PK;
          delete cleanItem.GSI2SK;
          delete cleanItem.entityType;
          items.push(cleanItem as T);
        }
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);
  }

  /**
   * Log a message with structured context
   *
   * Provides structured logging with consistent format for monitoring and debugging.
   * All logs include timestamp, level, adapter name, table name, and optional metadata.
   *
   * @param level - Log level (info, warn, error)
   * @param message - Log message
   * @param meta - Additional metadata (errors, operation context, etc.)
   */
  private log(
    level: "info" | "warn" | "error",
    message: string,
    meta?: Record<string, unknown>
  ): void {
    const logEntry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      message,
      adapter: "DynamoDBAdapter",
      tableName: this.tableName,
    };

    // Add metadata if provided
    if (meta) {
      // Handle Error objects specially to extract useful information
      if (meta.error && meta.error instanceof Error) {
        logEntry.error = {
          name: meta.error.name,
          message: meta.error.message,
          stack: meta.error.stack,
        };
        // Remove the original error object to avoid circular references
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { error, ...restMeta } = meta;
        Object.assign(logEntry, restMeta);
      } else {
        Object.assign(logEntry, meta);
      }
    }

    // Output to appropriate console method based on level
    if (level === "error") {
      console.error(JSON.stringify(logEntry, null, 2));
    } else if (level === "warn") {
      console.warn(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }
}
