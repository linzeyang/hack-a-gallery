/**
 * AWS Configuration Module Tests
 *
 * Validates the AWS configuration and client creation logic
 * Following AAA (Arrange, Act, Assert) pattern for clarity
 */

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import type { AWSConfig } from "./aws";
import {
  getAWSConfig,
  getDynamoDBClient,
  getDocumentClient,
  resetClients,
  validateSecurityConfiguration,
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
    describe("security validation", () => {
      it("should throw error when called from browser", () => {
        // Arrange: Mock browser environment
        vi.stubGlobal("window", {});
        process.env.DYNAMODB_TABLE_NAME = "test-table";

        // Act & Assert
        expect(() => getAWSConfig()).toThrow(
          "AWS configuration must not be accessed from browser"
        );

        // Cleanup
        vi.unstubAllGlobals();
      });

      it("should work in server environment", () => {
        // Arrange: Ensure server environment (no window)
        vi.unstubAllGlobals();
        process.env.DYNAMODB_TABLE_NAME = "test-table";

        // Act
        const config = getAWSConfig();

        // Assert
        expect(config).toBeDefined();
        expect(config.tableName).toBe("test-table");
      });
    });

    describe("region configuration", () => {
      it("should use default region (us-west-2) when not specified", () => {
        // Arrange
        process.env.DYNAMODB_TABLE_NAME = "test-table";

        // Act
        const config = getAWSConfig();

        // Assert
        expect(config.region).toBe("us-west-2");
        expect(config.tableName).toBe("test-table");
        expect(config.endpoint).toBeUndefined();
      });

      it("should prioritize HACKAGALLERY_AWS_REGION over AWS_REGION", () => {
        // Arrange
        process.env.HACKAGALLERY_AWS_REGION = "eu-central-1";
        process.env.AWS_REGION = "eu-west-1";
        process.env.DYNAMODB_TABLE_NAME = "test-table";

        // Act
        const config = getAWSConfig();

        // Assert
        expect(config.region).toBe("eu-central-1");
      });

      it("should use AWS_REGION when HACKAGALLERY_AWS_REGION not set", () => {
        // Arrange
        process.env.AWS_REGION = "eu-west-1";
        process.env.DYNAMODB_TABLE_NAME = "test-table";

        // Act
        const config = getAWSConfig();

        // Assert
        expect(config.region).toBe("eu-west-1");
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

      it("should provide clear error message about server-side only requirement", () => {
        // Arrange: No table name set

        // Act & Assert
        expect(() => getAWSConfig()).toThrow(
          "This must be set as a server-side environment variable"
        );
      });
    });
  });

  describe("getDynamoDBClient", () => {
    const createTestConfig = (overrides?: Partial<AWSConfig>): AWSConfig => ({
      region: "us-west-2",
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
      region: "us-west-2",
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
        region: "us-west-2",
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

  describe("validateSecurityConfiguration", () => {
    it("should pass validation with secure configuration", () => {
      // Arrange: Clean environment with no exposed variables
      process.env = {
        ...originalEnv,
        DYNAMODB_TABLE_NAME: "test-table",
        AWS_REGION: "us-west-2",
      };

      // Act & Assert
      expect(() => validateSecurityConfiguration()).not.toThrow();
    });

    it("should detect exposed DYNAMODB_TABLE_NAME", () => {
      // Arrange
      process.env.NEXT_PUBLIC_DYNAMODB_TABLE_NAME = "exposed-table";

      // Act & Assert
      expect(() => validateSecurityConfiguration()).toThrow(
        "Security violation: Sensitive variables exposed to browser"
      );
    });

    it("should detect exposed DYNAMODB_ENDPOINT", () => {
      // Arrange
      process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT = "http://localhost:8000";

      // Act & Assert
      expect(() => validateSecurityConfiguration()).toThrow(
        "Security violation: Sensitive variables exposed to browser"
      );
    });

    it("should detect exposed AWS credentials", () => {
      // Arrange
      process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";

      // Act & Assert
      expect(() => validateSecurityConfiguration()).toThrow(
        "Security violation: Sensitive variables exposed to browser"
      );
    });

    it("should detect exposed SECRET variables", () => {
      // Arrange
      process.env.NEXT_PUBLIC_SECRET_KEY = "secret-value";

      // Act & Assert
      expect(() => validateSecurityConfiguration()).toThrow(
        "Security violation: Sensitive variables exposed to browser"
      );
    });

    it("should detect AWS access key patterns", () => {
      // Arrange
      process.env.NEXT_PUBLIC_SOME_AKIA_VAR = "AKIAIOSFODNN7EXAMPLE";

      // Act & Assert
      expect(() => validateSecurityConfiguration()).toThrow(
        "Security violation: AWS credentials detected in browser-accessible variables"
      );
    });

    it("should allow safe NEXT_PUBLIC variables", () => {
      // Arrange
      process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
      process.env.NEXT_PUBLIC_ENV = "development";

      // Act & Assert
      expect(() => validateSecurityConfiguration()).not.toThrow();
    });
  });
});
