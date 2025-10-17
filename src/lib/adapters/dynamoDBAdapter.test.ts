import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DynamoDBAdapter } from "./dynamoDBAdapter";
import type { AWSConfig } from "@/lib/config/aws";

// Mock the AWS SDK
vi.mock("@/lib/config/aws", () => ({
  getDocumentClient: vi.fn(() => ({
    send: vi.fn(),
  })),
}));

describe("DynamoDBAdapter", () => {
  let adapter: DynamoDBAdapter;
  let mockSend: ReturnType<typeof vi.fn>;
  const mockConfig: AWSConfig = {
    region: "us-east-1",
    tableName: "test-table",
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create adapter instance
    adapter = new DynamoDBAdapter(mockConfig);

    // Get reference to mocked send function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockSend = (adapter as any).docClient.send;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("parseKey", () => {
    it("should parse event key correctly", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).parseKey("event:evt_123");
      expect(result).toEqual({
        PK: "EVENT#evt_123",
        SK: "METADATA",
      });
    });

    it("should parse project key correctly", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).parseKey("project:evt_123:proj_789");
      expect(result).toEqual({
        PK: "EVENT#evt_123",
        SK: "PROJECT#proj_789",
      });
    });

    it("should parse user key correctly", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).parseKey("user:user_101");
      expect(result).toEqual({
        PK: "USER#user_101",
        SK: "METADATA",
      });
    });

    it("should throw error for invalid key format", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (adapter as any).parseKey("invalid")).toThrow(
        "Invalid key format"
      );
    });

    it("should throw error for unknown entity type", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (adapter as any).parseKey("unknown:123")).toThrow(
        "Unknown entity type"
      );
    });

    it("should throw error for event key with too many parts", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (adapter as any).parseKey("event:evt_123:extra")).toThrow(
        "Invalid event key format"
      );
    });

    it("should throw error for project key with missing parts", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (adapter as any).parseKey("project:evt_123")).toThrow(
        "Invalid project key format"
      );
    });

    it("should throw error for user key with too many parts", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (adapter as any).parseKey("user:user_101:extra")).toThrow(
        "Invalid user key format"
      );
    });

    it("should handle keys with special characters", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).parseKey("event:evt_123-test");
      expect(result).toEqual({
        PK: "EVENT#evt_123-test",
        SK: "METADATA",
      });
    });

    it("should handle keys with uppercase entity type", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).parseKey("EVENT:evt_123");
      expect(result).toEqual({
        PK: "EVENT#evt_123",
        SK: "METADATA",
      });
    });
  });

  describe("buildKey", () => {
    it("should build event key from PK and SK", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).buildKey("EVENT#evt_123", "METADATA");
      expect(result).toBe("event:evt_123");
    });

    it("should build project key from PK and SK", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).buildKey(
        "EVENT#evt_123",
        "PROJECT#proj_789"
      );
      expect(result).toBe("project:evt_123:proj_789");
    });

    it("should build user key from PK and SK", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).buildKey("USER#user_101", "METADATA");
      expect(result).toBe("user:user_101");
    });

    it("should throw error for invalid PK format", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (adapter as any).buildKey("INVALID", "METADATA")).toThrow(
        "Invalid PK format"
      );
    });

    it("should throw error for invalid SK pattern", () => {
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adapter as any).buildKey("EVENT#evt_123", "INVALID")
      ).toThrow("Unable to build key");
    });

    it("should round-trip event key correctly", () => {
      const originalKey = "event:evt_123";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { PK, SK } = (adapter as any).parseKey(originalKey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rebuiltKey = (adapter as any).buildKey(PK, SK);
      expect(rebuiltKey).toBe(originalKey);
    });

    it("should round-trip project key correctly", () => {
      const originalKey = "project:evt_123:proj_789";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { PK, SK } = (adapter as any).parseKey(originalKey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rebuiltKey = (adapter as any).buildKey(PK, SK);
      expect(rebuiltKey).toBe(originalKey);
    });

    it("should round-trip user key correctly", () => {
      const originalKey = "user:user_101";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { PK, SK } = (adapter as any).parseKey(originalKey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rebuiltKey = (adapter as any).buildKey(PK, SK);
      expect(rebuiltKey).toBe(originalKey);
    });
  });

  describe("generateGSIKeys", () => {
    it("should generate GSI keys for event", () => {
      const item = { id: "evt_123", organizerId: "user_456" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).generateGSIKeys(
        item,
        "EVENT#evt_123",
        "METADATA"
      );

      expect(result).toEqual({
        GSI1PK: "ORGANIZER#user_456",
        GSI1SK: "EVENT#evt_123",
      });
    });

    it("should generate GSI keys for project", () => {
      const item = { id: "proj_789", hackerId: "user_101" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).generateGSIKeys(
        item,
        "EVENT#evt_123",
        "PROJECT#proj_789"
      );

      expect(result).toEqual({
        GSI1PK: "HACKER#user_101",
        GSI1SK: "PROJECT#proj_789",
      });
    });

    it("should generate GSI keys for user with both email and role", () => {
      const item = {
        id: "user_101",
        email: "test@example.com",
        role: "hacker",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).generateGSIKeys(
        item,
        "USER#user_101",
        "METADATA"
      );

      expect(result).toEqual({
        GSI1PK: "EMAIL#test@example.com",
        GSI1SK: "USER#user_101",
        GSI2PK: "ROLE#hacker",
        GSI2SK: "USER#user_101",
      });
    });

    it("should generate only GSI1 for user with email but no role (sparse index)", () => {
      const item = {
        id: "user_101",
        email: "test@example.com",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).generateGSIKeys(
        item,
        "USER#user_101",
        "METADATA"
      );

      expect(result).toEqual({
        GSI1PK: "EMAIL#test@example.com",
        GSI1SK: "USER#user_101",
      });
      expect(result).not.toHaveProperty("GSI2PK");
      expect(result).not.toHaveProperty("GSI2SK");
    });

    it("should generate only GSI2 for user with role but no email (sparse index)", () => {
      const item = {
        id: "user_101",
        role: "organizer",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).generateGSIKeys(
        item,
        "USER#user_101",
        "METADATA"
      );

      expect(result).toEqual({
        GSI2PK: "ROLE#organizer",
        GSI2SK: "USER#user_101",
      });
      expect(result).not.toHaveProperty("GSI1PK");
      expect(result).not.toHaveProperty("GSI1SK");
    });

    it("should return empty object for event missing organizerId (sparse index)", () => {
      const item = { id: "evt_123", name: "Test Event" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).generateGSIKeys(
        item,
        "EVENT#evt_123",
        "METADATA"
      );

      expect(result).toEqual({});
    });

    it("should return empty object for project missing hackerId (sparse index)", () => {
      const item = { id: "proj_789", name: "Test Project" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).generateGSIKeys(
        item,
        "EVENT#evt_123",
        "PROJECT#proj_789"
      );

      expect(result).toEqual({});
    });

    it("should return empty object for user missing both email and role (sparse index)", () => {
      const item = { id: "user_101", name: "Test User" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).generateGSIKeys(
        item,
        "USER#user_101",
        "METADATA"
      );

      expect(result).toEqual({});
    });

    it("should handle different user roles", () => {
      const roles = ["hacker", "organizer", "investor"];

      roles.forEach((role) => {
        const item = { id: "user_101", email: "test@example.com", role };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (adapter as any).generateGSIKeys(
          item,
          "USER#user_101",
          "METADATA"
        );

        expect(result.GSI2PK).toBe(`ROLE#${role}`);
      });
    });

    it("should not generate GSI keys for unknown entity types", () => {
      const item = { id: "unknown_123" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (adapter as any).generateGSIKeys(
        item,
        "UNKNOWN#unknown_123",
        "METADATA"
      );

      expect(result).toEqual({});
    });
  });

  describe("get", () => {
    it("should retrieve item successfully", async () => {
      const mockItem = {
        PK: "EVENT#evt_123",
        SK: "METADATA",
        id: "evt_123",
        name: "Test Event",
      };

      mockSend.mockResolvedValueOnce({ Item: mockItem });

      const result = await adapter.get("event:evt_123");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: "test-table",
            Key: { PK: "EVENT#evt_123", SK: "METADATA" },
          }),
        })
      );
      expect(result).toEqual({
        id: "evt_123",
        name: "Test Event",
      });
    });

    it("should return null when item not found", async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const result = await adapter.get("event:evt_123");

      expect(result).toBeNull();
    });

    it("should remove DynamoDB-specific keys from result", async () => {
      const mockItem = {
        PK: "EVENT#evt_123",
        SK: "METADATA",
        GSI1PK: "ORGANIZER#user_456",
        GSI1SK: "EVENT#evt_123",
        entityType: "Event",
        id: "evt_123",
        name: "Test Event",
      };

      mockSend.mockResolvedValueOnce({ Item: mockItem });

      const result = await adapter.get("event:evt_123");

      expect(result).not.toHaveProperty("PK");
      expect(result).not.toHaveProperty("SK");
      expect(result).not.toHaveProperty("GSI1PK");
      expect(result).not.toHaveProperty("GSI1SK");
      expect(result).not.toHaveProperty("entityType");
    });

    it("should retry on throttling error", async () => {
      const throttleError = new Error("Throttled");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (throttleError as any).name = "ThrottlingException";

      mockSend
        .mockRejectedValueOnce(throttleError)
        .mockResolvedValueOnce({ Item: { id: "evt_123" } });

      const result = await adapter.get("event:evt_123");

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: "evt_123" });
    });

    it("should throw on non-retryable error", async () => {
      const validationError = new Error("Validation failed");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (validationError as any).name = "ValidationException";

      mockSend.mockRejectedValueOnce(validationError);

      await expect(adapter.get("event:evt_123")).rejects.toThrow(
        "Validation failed"
      );
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("set", () => {
    it("should store new item with timestamps", async () => {
      const item = { id: "evt_123", name: "Test Event" };
      mockSend.mockResolvedValueOnce({});

      await adapter.set("event:evt_123", item);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: "test-table",
            Item: expect.objectContaining({
              PK: "EVENT#evt_123",
              SK: "METADATA",
              id: "evt_123",
              name: "Test Event",
              entityType: "Event",
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            }),
          }),
        })
      );
    });

    it("should update existing item without changing createdAt", async () => {
      const existingCreatedAt = "2024-01-01T00:00:00Z";
      const item = {
        id: "evt_123",
        name: "Updated Event",
        createdAt: existingCreatedAt,
      };
      mockSend.mockResolvedValueOnce({});

      await adapter.set("event:evt_123", item);

      const call = mockSend.mock.calls[0][0];
      expect(call.input.Item.createdAt).toBe(existingCreatedAt);
      expect(call.input.Item.updatedAt).not.toBe(existingCreatedAt);
    });

    it("should generate GSI keys for event", async () => {
      const item = {
        id: "evt_123",
        name: "Test Event",
        organizerId: "user_456",
      };
      mockSend.mockResolvedValueOnce({});

      await adapter.set("event:evt_123", item);

      const call = mockSend.mock.calls[0][0];
      expect(call.input.Item).toMatchObject({
        GSI1PK: "ORGANIZER#user_456",
        GSI1SK: "EVENT#evt_123",
      });
    });

    it("should generate GSI keys for project", async () => {
      const item = {
        id: "proj_789",
        name: "Test Project",
        hackerId: "user_101",
      };
      mockSend.mockResolvedValueOnce({});

      await adapter.set("project:evt_123:proj_789", item);

      const call = mockSend.mock.calls[0][0];
      expect(call.input.Item).toMatchObject({
        PK: "EVENT#evt_123",
        SK: "PROJECT#proj_789",
        GSI1PK: "HACKER#user_101",
        GSI1SK: "PROJECT#proj_789",
        entityType: "Project",
      });
    });
  });

  describe("remove", () => {
    it("should delete item successfully", async () => {
      mockSend.mockResolvedValueOnce({});

      await adapter.remove("event:evt_123");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: "test-table",
            Key: { PK: "EVENT#evt_123", SK: "METADATA" },
          }),
        })
      );
    });

    it("should handle errors during deletion", async () => {
      const error = new Error("Delete failed");
      mockSend.mockRejectedValueOnce(error);

      await expect(adapter.remove("event:evt_123")).rejects.toThrow(
        "Delete failed"
      );
    });
  });

  describe("getAll", () => {
    it("should scan for all events", async () => {
      const mockItems = [
        { PK: "EVENT#evt_1", SK: "METADATA", id: "evt_1", name: "Event 1" },
        { PK: "EVENT#evt_2", SK: "METADATA", id: "evt_2", name: "Event 2" },
      ];

      mockSend.mockResolvedValueOnce({ Items: mockItems });

      const result = await adapter.getAll("event:");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: "test-table",
            FilterExpression: "begins_with(PK, :pkPrefix) AND SK = :sk",
            ExpressionAttributeValues: {
              ":pkPrefix": "EVENT#",
              ":sk": "METADATA",
            },
          }),
        })
      );
      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty("PK");
    });

    it("should query projects by event", async () => {
      const mockItems = [
        {
          PK: "EVENT#evt_123",
          SK: "PROJECT#proj_1",
          id: "proj_1",
          name: "Project 1",
        },
        {
          PK: "EVENT#evt_123",
          SK: "PROJECT#proj_2",
          id: "proj_2",
          name: "Project 2",
        },
      ];

      mockSend.mockResolvedValueOnce({ Items: mockItems });

      const result = await adapter.getAll("project:evt_123:");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: "test-table",
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
            ExpressionAttributeValues: {
              ":pk": "EVENT#evt_123",
              ":skPrefix": "PROJECT#",
            },
          }),
        })
      );
      expect(result).toHaveLength(2);
    });

    it("should handle pagination", async () => {
      const mockItems1 = [{ PK: "EVENT#evt_1", SK: "METADATA", id: "evt_1" }];
      const mockItems2 = [{ PK: "EVENT#evt_2", SK: "METADATA", id: "evt_2" }];

      mockSend
        .mockResolvedValueOnce({
          Items: mockItems1,
          LastEvaluatedKey: { PK: "EVENT#evt_1", SK: "METADATA" },
        })
        .mockResolvedValueOnce({ Items: mockItems2 });

      const result = await adapter.getAll("event:");

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it("should throw error for querying all projects without event ID", async () => {
      await expect(adapter.getAll("project:")).rejects.toThrow(
        "Cannot query all projects without event ID"
      );
    });
  });

  describe("clear", () => {
    it("should delete all items in batches", async () => {
      const mockKeys = Array.from({ length: 30 }, (_, i) => ({
        PK: `EVENT#evt_${i}`,
        SK: "METADATA",
      }));

      // Mock scan to return keys
      mockSend.mockResolvedValueOnce({ Items: mockKeys });

      // Mock batch delete operations
      mockSend.mockResolvedValue({});

      await adapter.clear();

      // Should call scan once + 2 batch deletes (25 items each)
      expect(mockSend).toHaveBeenCalledTimes(3);

      // Verify batch delete calls
      const batchCalls = mockSend.mock.calls.slice(1);
      expect(batchCalls[0][0].input.RequestItems["test-table"]).toHaveLength(
        25
      );
      expect(batchCalls[1][0].input.RequestItems["test-table"]).toHaveLength(5);
    });

    it("should handle pagination during scan", async () => {
      const mockKeys1 = [{ PK: "EVENT#evt_1", SK: "METADATA" }];
      const mockKeys2 = [{ PK: "EVENT#evt_2", SK: "METADATA" }];

      mockSend
        .mockResolvedValueOnce({
          Items: mockKeys1,
          LastEvaluatedKey: { PK: "EVENT#evt_1", SK: "METADATA" },
        })
        .mockResolvedValueOnce({ Items: mockKeys2 })
        .mockResolvedValue({});

      await adapter.clear();

      // 2 scans + 1 batch delete
      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });

  describe("executeWithRetry", () => {
    it("should succeed on first attempt", async () => {
      const operation = vi.fn().mockResolvedValue("success");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (adapter as any).executeWithRetry(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry on ProvisionedThroughputExceededException", async () => {
      const throttleError = new Error("Throttled");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (throttleError as any).name = "ProvisionedThroughputExceededException";

      const operation = vi
        .fn()
        .mockRejectedValueOnce(throttleError)
        .mockRejectedValueOnce(throttleError)
        .mockResolvedValueOnce("success");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (adapter as any).executeWithRetry(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should retry on ThrottlingException", async () => {
      const throttleError = new Error("Throttled");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (throttleError as any).name = "ThrottlingException";

      const operation = vi
        .fn()
        .mockRejectedValueOnce(throttleError)
        .mockResolvedValueOnce("success");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (adapter as any).executeWithRetry(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should retry on RequestLimitExceeded", async () => {
      const error = new Error("Request limit exceeded");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).name = "RequestLimitExceeded";

      const operation = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (adapter as any).executeWithRetry(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should retry on ServiceUnavailable", async () => {
      const error = new Error("Service unavailable");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).name = "ServiceUnavailable";

      const operation = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (adapter as any).executeWithRetry(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should retry on InternalServerError", async () => {
      const error = new Error("Internal server error");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).name = "InternalServerError";

      const operation = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (adapter as any).executeWithRetry(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should retry on NetworkingError", async () => {
      const error = new Error("Network error");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).name = "NetworkingError";

      const operation = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (adapter as any).executeWithRetry(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should retry on TimeoutError", async () => {
      const error = new Error("Timeout");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).name = "TimeoutError";

      const operation = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (adapter as any).executeWithRetry(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should throw after max retries exhausted", async () => {
      const throttleError = new Error("Throttled");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (throttleError as any).name = "ThrottlingException";

      const operation = vi.fn().mockRejectedValue(throttleError);

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adapter as any).executeWithRetry(operation, 3)
      ).rejects.toThrow("Throttled");
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should respect custom max retries parameter", async () => {
      const throttleError = new Error("Throttled");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (throttleError as any).name = "ThrottlingException";

      const operation = vi.fn().mockRejectedValue(throttleError);

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adapter as any).executeWithRetry(operation, 5)
      ).rejects.toThrow("Throttled");
      expect(operation).toHaveBeenCalledTimes(5);
    });

    it("should not retry non-retryable errors", async () => {
      const validationError = new Error("Validation failed");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (validationError as any).name = "ValidationException";

      const operation = vi.fn().mockRejectedValue(validationError);

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adapter as any).executeWithRetry(operation)
      ).rejects.toThrow("Validation failed");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should not retry ResourceNotFoundException", async () => {
      const error = new Error("Resource not found");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).name = "ResourceNotFoundException";

      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adapter as any).executeWithRetry(operation)
      ).rejects.toThrow("Resource not found");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should implement exponential backoff delays", async () => {
      const throttleError = new Error("Throttled");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (throttleError as any).name = "ThrottlingException";

      const operation = vi
        .fn()
        .mockRejectedValueOnce(throttleError)
        .mockRejectedValueOnce(throttleError)
        .mockResolvedValueOnce("success");

      const startTime = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adapter as any).executeWithRetry(operation);
      const endTime = Date.now();

      // Should have delays of 100ms and 200ms = 300ms minimum
      // Allow some tolerance for execution time
      expect(endTime - startTime).toBeGreaterThanOrEqual(250);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should handle errors without name property", async () => {
      const error = new Error("Unknown error");
      delete (error as { name?: string }).name;

      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adapter as any).executeWithRetry(operation)
      ).rejects.toThrow("Unknown error");
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});
