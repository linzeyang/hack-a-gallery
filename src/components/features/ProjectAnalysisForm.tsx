/**
 * ProjectAnalysisForm Component
 *
 * Form component for analyzing GitHub repositories using the Project Intelligence Agent.
 * Includes URL validation, loading states, error handling, and retry functionality.
 */

"use client";

import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  analyzeProject,
  validateGitHubUrl,
  parseGitHubUrl,
} from "@/services/analysisService";
import type {
  AnalysisFormProps,
  AnalysisFormState,
  ErrorDetail,
} from "@/lib/types/analysis";

/**
 * ProjectAnalysisForm Component
 */
export const ProjectAnalysisForm: React.FC<AnalysisFormProps> = ({
  initialUrl = "",
  onAnalysisComplete,
  onAnalysisError,
  isLoading: externalLoading = false,
  disabled = false,
  className = "",
}) => {
  // Form state
  const [formState, setFormState] = useState<AnalysisFormState>({
    data: {
      repositoryUrl: initialUrl,
    },
    errors: {},
    isSubmitting: false,
    hasSubmitted: false,
  });

  // Analysis state
  const [analysisState, setAnalysisState] = useState<{
    requestId: string | null;
    startTime: number | null;
    retryCount: number;
  }>({
    requestId: null,
    startTime: null,
    retryCount: 0,
  });

  const isLoading = externalLoading || formState.isSubmitting;

  /**
   * Validate the form data
   */
  const validateForm = useCallback(
    (url: string) => {
      const errors: typeof formState.errors = {};

      // Validate repository URL
      const urlValidation = validateGitHubUrl(url);
      if (!urlValidation.isValid) {
        errors.repositoryUrl = urlValidation.error;
      }

      return errors;
    },
    [formState]
  );

  /**
   * Handle input change
   */
  const handleInputChange = useCallback((value: string) => {
    setFormState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        repositoryUrl: value,
      },
      errors: {
        ...prev.errors,
        repositoryUrl: undefined, // Clear error on change
      },
    }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const { repositoryUrl } = formState.data;
      const errors = validateForm(repositoryUrl);

      // Update form state with validation results
      setFormState((prev) => ({
        ...prev,
        errors,
        hasSubmitted: true,
        isSubmitting: Object.keys(errors).length === 0,
      }));

      // Stop if validation failed
      if (Object.keys(errors).length > 0) {
        return;
      }

      // Start analysis
      const requestId = `req_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const startTime = Date.now();

      setAnalysisState((prev) => ({
        ...prev,
        requestId,
        startTime,
        retryCount: 0,
      }));

      try {
        const response = await analyzeProject(repositoryUrl.trim());

        if (response.success && response.data) {
          // Analysis successful
          onAnalysisComplete?.(response.data);

          // Reset form state
          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
            errors: {},
          }));
        } else {
          // Analysis failed
          const error = response.error || {
            code: "UNKNOWN_ERROR",
            message: "Analysis failed for unknown reason",
            timestamp: new Date().toISOString(),
          };

          onAnalysisError?.(error);

          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
            errors: {
              general: error.message,
            },
          }));
        }
      } catch {
        // Network or unexpected error
        const errorDetail: ErrorDetail = {
          code: "NETWORK_ERROR",
          message: "Failed to connect to analysis service. Please try again.",
          timestamp: new Date().toISOString(),
        };

        onAnalysisError?.(errorDetail);

        setFormState((prev) => ({
          ...prev,
          isSubmitting: false,
          errors: {
            general: errorDetail.message,
          },
        }));
      } finally {
        setAnalysisState((prev) => ({
          ...prev,
          startTime: null,
        }));
      }
    },
    [formState.data, validateForm, onAnalysisComplete, onAnalysisError]
  );

  /**
   * Handle retry
   */
  const handleRetry = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      errors: {},
    }));

    setAnalysisState((prev) => ({
      ...prev,
      retryCount: prev.retryCount + 1,
    }));

    // Trigger form submission
    const form = document.getElementById("analysis-form") as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  }, []);

  /**
   * Get repository info for display
   */
  const repositoryInfo = React.useMemo(() => {
    const { repositoryUrl } = formState.data;
    if (!repositoryUrl.trim()) return null;

    const parsed = parseGitHubUrl(repositoryUrl.trim());
    return parsed;
  }, [formState.data]);

  /**
   * Calculate estimated time remaining
   */
  const estimatedTimeRemaining = React.useMemo(() => {
    if (!analysisState.startTime) return null;

    const elapsed = Date.now() - analysisState.startTime;
    const estimated = Math.max(0, 30000 - elapsed); // Estimate 30 seconds total

    return Math.ceil(estimated / 1000);
  }, [analysisState.startTime]);

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <form id="analysis-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analyze GitHub Repository
          </h2>
          <p className="text-gray-600">
            Get AI-powered insights about your project&apos;s technologies,
            features, and more.
          </p>
        </div>

        {/* Repository URL Input */}
        <div>
          <Input
            label="GitHub Repository URL *"
            inputType="url"
            value={formState.data.repositoryUrl}
            onChange={(e) => handleInputChange(e.target.value)}
            error={formState.errors.repositoryUrl}
            placeholder="https://github.com/owner/repository"
            disabled={disabled || isLoading}
            className="text-lg"
          />

          {/* Repository Info Display */}
          {repositoryInfo && !formState.errors.repositoryUrl && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">
                  {repositoryInfo.owner}/{repositoryInfo.repo}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* General Error Display */}
        {formState.errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Analysis Failed
                </h3>
                <p className="text-sm text-red-700">
                  {formState.errors.general}
                </p>
                {analysisState.retryCount < 3 && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="animate-spin h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Analyzing Repository...
                </h3>
                <p className="text-sm text-blue-700">
                  Our AI agent is analyzing the repository structure,
                  technologies, and features.
                  {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
                    <span className="ml-1">
                      Estimated time remaining: {estimatedTimeRemaining}s
                    </span>
                  )}
                </p>
                {analysisState.retryCount > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Retry attempt {analysisState.retryCount}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={
              disabled || isLoading || !formState.data.repositoryUrl.trim()
            }
            className="min-w-[200px]"
          >
            {isLoading ? "Analyzing..." : "Analyze Repository"}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Analysis typically takes 15-30 seconds. We&apos;ll extract
            technologies, features, and generate a summary of your project.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ProjectAnalysisForm;
