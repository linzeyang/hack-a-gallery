/**
 * Analysis API Service
 *
 * Provides client-side API functions for project analysis functionality.
 * Includes error handling, retries, and timeout configuration.
 */

import type {
  AnalyzeProjectRequest,
  AnalysisResponse,
  AnalysisApiClient,
  AnalysisApiConfig,
  ErrorDetail,
} from "@/lib/types/analysis";

/**
 * Default configuration for the analysis API client
 */
const DEFAULT_CONFIG: AnalysisApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  timeout: 60000, // 60 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if an error is retryable
 */
const isRetryableError = (error: unknown): boolean => {
  // Retry on network errors, timeouts, and 5xx server errors
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    (error.name === "TypeError" || error.name === "AbortError")
  ) {
    return true;
  }

  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Retry on rate limiting
    if (error.status === 429) {
      return true;
    }
  }

  return false;
};

/**
 * Create a standardized error from various error types
 */
const createErrorDetail = (error: unknown, requestId?: string): ErrorDetail => {
  // If it's already a structured error from the API
  if (
    error &&
    typeof error === "object" &&
    "detail" in error &&
    error.detail &&
    typeof error.detail === "object" &&
    "error" in error.detail
  ) {
    return error.detail.error as ErrorDetail;
  }

  // Network or timeout errors
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "TypeError"
  ) {
    return {
      code: "NETWORK_ERROR",
      message:
        "Network connection failed. Please check your internet connection.",
      details:
        "message" in error && typeof error.message === "string"
          ? { originalError: error.message }
          : {},
      timestamp: new Date().toISOString(),
    };
  }

  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "AbortError"
  ) {
    return {
      code: "REQUEST_TIMEOUT",
      message: "Request timed out. Please try again.",
      details: { timeout: DEFAULT_CONFIG.timeout },
      timestamp: new Date().toISOString(),
    };
  }

  // HTTP errors
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    const statusMessages: Record<number, string> = {
      400: "Invalid request. Please check the repository URL.",
      401: "Authentication failed. Please refresh the page.",
      403: "Access denied. You may not have permission to access this resource.",
      404: "Repository not found or is private.",
      429: "Too many requests. Please wait a moment and try again.",
      500: "Server error. Please try again later.",
      502: "Service temporarily unavailable. Please try again later.",
      503: "Service temporarily unavailable. Please try again later.",
      504: "Request timed out. Please try again.",
    };

    return {
      code: `HTTP_${error.status}`,
      message:
        statusMessages[error.status] || `HTTP error ${error.status}`,
      details: { status: error.status, requestId },
      timestamp: new Date().toISOString(),
    };
  }

  // Generic error
  return {
    code: "UNKNOWN_ERROR",
    message:
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "An unexpected error occurred. Please try again.",
    details: { originalError: String(error), requestId },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Analysis API Client Implementation
 */
class AnalysisApiClientImpl implements AnalysisApiClient {
  private config: AnalysisApiConfig;

  constructor(config: Partial<AnalysisApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze a GitHub repository with retry logic and error handling
   */
  async analyzeProject(
    request: AnalyzeProjectRequest
  ): Promise<AnalysisResponse> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout
        );

        const response = await fetch(
          `${this.config.baseUrl}/api/projects/analyze`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        // Parse response
        const data = await response.json();

        // Handle successful response
        if (response.ok) {
          return data as AnalysisResponse;
        }

        // Handle error response
        const error = new Error(`HTTP ${response.status}`) as Error & {
          status: number;
          detail: unknown;
        };
        error.status = response.status;
        error.detail = data;
        throw error;
      } catch (error: unknown) {
        lastError = error;

        // Don't retry on the last attempt or non-retryable errors
        if (attempt === this.config.retries || !isRetryableError(error)) {
          break;
        }

        // Wait before retrying
        await sleep(this.config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }

    // All retries failed, return error response
    const errorDetail = createErrorDetail(lastError);

    return {
      success: false,
      error: errorDetail,
      request_id: "client-error-" + Date.now(),
    };
  }
}

/**
 * Default analysis API client instance
 */
export const analysisApiClient = new AnalysisApiClientImpl();

/**
 * Create a custom analysis API client with specific configuration
 */
export const createAnalysisApiClient = (
  config: Partial<AnalysisApiConfig>
): AnalysisApiClient => {
  return new AnalysisApiClientImpl(config);
};

/**
 * Convenience function to analyze a project
 */
export const analyzeProject = async (
  repositoryUrl: string
): Promise<AnalysisResponse> => {
  return analysisApiClient.analyzeProject({ repository_url: repositoryUrl });
};

/**
 * Validate GitHub URL format
 */
export const validateGitHubUrl = (
  url: string
): { isValid: boolean; error?: string } => {
  if (!url || typeof url !== "string") {
    return { isValid: false, error: "Repository URL is required" };
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return { isValid: false, error: "Repository URL is required" };
  }

  // Basic URL validation
  try {
    new URL(trimmedUrl);
  } catch {
    return { isValid: false, error: "Invalid URL format" };
  }

  // GitHub-specific validation
  const githubPattern =
    /^https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}\/[a-zA-Z0-9][a-zA-Z0-9._-]*\/?$/;

  if (!githubPattern.test(trimmedUrl)) {
    return {
      isValid: false,
      error:
        "Invalid GitHub URL. Expected format: https://github.com/owner/repo",
    };
  }

  return { isValid: true };
};

/**
 * Extract owner and repository name from GitHub URL
 */
export const parseGitHubUrl = (
  url: string
): { owner: string; repo: string } | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
        repo: pathParts[1],
      };
    }
  } catch {
    // Invalid URL
  }

  return null;
};

/**
 * Format analysis processing time for display
 */
export const formatProcessingTime = (timeMs: number): string => {
  if (timeMs < 1000) {
    return `${timeMs}ms`;
  }

  const seconds = Math.round(timeMs / 100) / 10;
  return `${seconds}s`;
};

/**
 * Get technology color based on category
 */
export const getTechnologyColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    language: "bg-blue-100 text-blue-800",
    framework: "bg-green-100 text-green-800",
    library: "bg-purple-100 text-purple-800",
    tool: "bg-orange-100 text-orange-800",
    database: "bg-red-100 text-red-800",
    platform: "bg-indigo-100 text-indigo-800",
    service: "bg-pink-100 text-pink-800",
  };

  return colorMap[category.toLowerCase()] || "bg-gray-100 text-gray-800";
};

/**
 * Get tag color based on category
 */
export const getTagColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    domain: "bg-emerald-100 text-emerald-800",
    type: "bg-cyan-100 text-cyan-800",
    feature: "bg-amber-100 text-amber-800",
    complexity: "bg-rose-100 text-rose-800",
  };

  return colorMap[category.toLowerCase()] || "bg-slate-100 text-slate-800";
};
