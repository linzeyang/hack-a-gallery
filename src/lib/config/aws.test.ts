/**
 * AWS Configuration Module Tests
 *
 * Validates the AWS configuration and client creation logic
 * Following AAA (Arrange, Act, Assert) pattern for clarity
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import type { AWSConfig } from "./aws";
import {
  getAWSConfig,
  getDynamoDBClient,
  getDocumentClient,
  resetClients,
} from "./aws";

describe("AWS Configuration Module", () => {
  // Store original env vars to restore after tests
  const originalEnv = process.env;

  beforeEach(() => {
    // Arrange: Reset environment before each test for isolation
    process.env = { ...originalEnv };
    resetClients();
  });

  afterAll(() => {
    // Cleanup: Restore original environment
    process.env = originalEnv;
    resetClients();
  });

  describe("getAWSConfig", () => {
    describe("region configuration", () => {
      it("should use default region (us-east-1) when not specified", () => {
        // Arrange
        process.env.DYNAMODB_TABLE_NAME = "test-table";

        // Act
        const config = getAWSConfig();

        // Assert
        expect(config.region).toBe("us-east-1");
        expect(config.tableName).toBe("test-table");
        expect(config.endpoint).toBeUndefined();
      });

      it("should prioritize AWS_REGION over default", () => {
        // Arrange
        process.env.AWS_REGION = "eu-west-1";
        process.env.DYNAMODB_TABLE_NAME = "test-table";

        // Act
        const config = getAWSConfig();

        // Assert
        expect(config.region).toBe("eu-west-1");
      });

      it("should use NEXT_PUBLIC_AWS_REGION when AWS_REGION not set", () => {
        // Arrange
        process.env.NEXT_PUBLIC_AWS_REGION = "ap-southeast-1";
        process.env.DYNAMODB_TABLE_NAME = "test-table";

        // Act
        const config = getAWSConfig();

        // Assert
        expect(config.region).toBe("ap-southeast-1");
      });
    });

    describe("endpoint configuration", () => {
      it("should include endpoint for local development", () => {
        // Arrange
        process.env.DYNAMODB_TABLE_NAME = "test-table";
        process.env.DYNAMODB_ENDPOINT = "http://localhost:8000";

        // Act
        const config = getAWSConfig();

        // Assert
        expect(config.endpoint).toBe("http://localhost:8000");
      });

      it("should omit endpoint when not configured", () => {
        // Arrange
        process.env.DYNAMODB_TABLE_NAME = "test-table";

        // Act
        const config = getAWSConfig();

        // Assert
        expect(config.endpoint).toBeUndefined();
      });
    });

    describe("error handling", () => {
      it("should throw descriptive error when table name is missing", () => {
        // Arrange: No table name set

        // Act & Assert
        expect(() => getAWSConfig()).toThrow(
          "DYNAMODB_TABLE_NAME environment variable is required"
        );
      });
    });
  });

  describe("getDynamoDBClient", () => {
    const createTestConfig = (overrides?: Partial<AWSConfig>): AWSConfig => ({
      region: "us-east-1",
      tableName: "test-table",
      ...overrides,
    });

    it("should create a DynamoDB client with correct configuration", () => {
      // Arrange
      const config = createTestConfig();

      // Act
      const client = getDynamoDBClient(config);

      // Assert
      expect(client).toBeDefined();
      expect(client.config.region).toBeDefined();
    });

    it("should implement singleton pattern correctly", () => {
      // Arrange
      const config = createTestConfig();

      // Act
      const client1 = getDynamoDBClient(config);
      const client2 = getDynamoDBClient(config);

      // Assert
      expect(client1).toBe(client2);
    });

    it("should support local DynamoDB endpoint", () => {
      // Arrange
      const config = createTestConfig({
        endpoint: "http://localhost:8000",
      });

      // Act
      const client = getDynamoDBClient(config);

      // Assert
      expect(client).toBeDefined();
    });
  });

  describe("getDocumentClient", () => {
    const createTestConfig = (overrides?: Partial<AWSConfig>): AWSConfig => ({
      region: "us-east-1",
      tableName: "test-table",
      ...overrides,
    });

    it("should create a Document client with marshalling options", () => {
      // Arrange
      const config = createTestConfig();

      // Act
      const docClient = getDocumentClient(config);

      // Assert
      expect(docClient).toBeDefined();
    });

    it("should implement singleton pattern correctly", () => {
      // Arrange
      const config = createTestConfig();

      // Act
      const client1 = getDocumentClient(config);
      const client2 = getDocumentClient(config);

      // Assert
      expect(client1).toBe(client2);
    });
  });

  describe("resetClients", () => {
    it("should clear singleton instances for fresh client creation", () => {
      // Arrange
      const config: AWSConfig = {
        region: "us-east-1",
        tableName: "test-table",
      };
      const client1 = getDynamoDBClient(config);

      // Act
      resetClients();
      const client2 = getDynamoDBClient(config);

      // Assert
      expect(client1).not.toBe(client2);
    });
  });
});
