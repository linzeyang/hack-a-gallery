/**
 * ProjectFormWithAnalysis Component
 *
 * Enhanced project form that integrates AI-powered repository analysis.
 * Combines the existing ProjectForm with ProjectAnalysisForm and ProjectAnalysisPreview.
 */

"use client";

import React, { useState, useCallback } from "react";
import { ProjectForm } from "./ProjectForm";
import { ProjectAnalysisForm } from "./ProjectAnalysisForm";
import { ProjectAnalysisPreview } from "./ProjectAnalysisPreview";
import { Button } from "@/components/ui/Button";
import type { Project } from "@/lib/types/project";
import type { ProjectAnalysis } from "@/lib/types/analysis";

export interface ProjectFormWithAnalysisProps {
  eventId: string;
  initialData?: Project;
  onSubmit: (data: Omit<Project, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

type FormStep = "analysis" | "form" | "preview";

export const ProjectFormWithAnalysis: React.FC<
  ProjectFormWithAnalysisProps
> = ({ eventId, initialData, onSubmit, onCancel, isSubmitting = false }) => {
  // Form state
  const [currentStep, setCurrentStep] = useState<FormStep>("analysis");
  const [analysisData, setAnalysisData] = useState<ProjectAnalysis | null>(
    null
  );
  const [enhancedProjectData, setEnhancedProjectData] =
    useState<Partial<Project> | null>(null);

  /**
   * Handle successful analysis completion
   */
  const handleAnalysisComplete = useCallback(
    (analysis: ProjectAnalysis, repositoryUrl: string) => {
      setAnalysisData(analysis);

      // Extract repository name from URL for default project name
      // e.g., "https://github.com/owner/repo-name" -> "repo-name"
      const repoName = repositoryUrl.split("/").pop()?.replace(/-/g, " ") || "";
      // Capitalize first letter of each word
      const projectName =
        repoName
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ") ||
        initialData?.name ||
        "";

      // Extract data from analysis to enhance project form
      const enhancedData: Partial<Project> = {
        ...initialData,
        name: projectName, // Set from repository name
        githubUrl: repositoryUrl, // Set from the analysis form URL
        description: analysis.summary || initialData?.description || "",
        technologies:
          analysis.technologies?.map((tech) => tech.name) ||
          initialData?.technologies ||
          [],
      };

      setEnhancedProjectData(enhancedData);
      setCurrentStep("preview");
    },
    [initialData]
  );

  /**
   * Handle analysis error
   */
  const handleAnalysisError = useCallback(() => {
    // Error is handled by the ProjectAnalysisForm component
    // This callback is here for future error handling if needed
    setAnalysisData(null);
  }, []);

  /**
   * Handle confirming analysis results
   */
  const handleConfirmAnalysis = useCallback(() => {
    setCurrentStep("form");
  }, []);

  /**
   * Handle editing analysis results
   */
  const handleEditAnalysis = useCallback(() => {
    // For now, just proceed to form - in the future, this could open an edit modal
    setCurrentStep("form");
  }, []);

  /**
   * Handle re-analyzing
   */
  const handleReAnalyze = useCallback(() => {
    setAnalysisData(null);
    setEnhancedProjectData(null);
    setCurrentStep("analysis");
  }, []);

  /**
   * Handle skipping analysis
   */
  const handleSkipAnalysis = useCallback(() => {
    setCurrentStep("form");
  }, []);

  /**
   * Handle going back to analysis
   */
  const handleBackToAnalysis = useCallback(() => {
    setCurrentStep("analysis");
  }, []);

  /**
   * Handle final form submission
   */
  const handleFormSubmit = useCallback(
    (data: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
      onSubmit(data);
    },
    [onSubmit]
  );

  /**
   * Render step indicator
   */
  const renderStepIndicator = () => {
    const steps = [
      { key: "analysis", label: "AI Analysis", icon: "🤖" },
      { key: "form", label: "Project Details", icon: "📝" },
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const isActive = currentStep === step.key;
          const isCompleted =
            (step.key === "analysis" &&
              (analysisData || currentStep === "form")) ||
            (step.key === "form" && currentStep === "form");

          return (
            <React.Fragment key={step.key}>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-800"
                    : isCompleted
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span className="text-lg">{step.icon}</span>
                <span className="font-medium">{step.label}</span>
                {isCompleted && !isActive && (
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-300 mx-2" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  /**
   * Render analysis step
   */
  const renderAnalysisStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AI-Powered Project Analysis
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get started by analyzing your GitHub repository. Our AI will extract
          technologies, features, and generate a summary to help you create a
          better project submission.
        </p>
      </div>

      <ProjectAnalysisForm
        initialUrl={initialData?.githubUrl}
        onAnalysisComplete={handleAnalysisComplete}
        onAnalysisError={handleAnalysisError}
        className="mb-6"
      />

      {/* Skip Analysis Option */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleSkipAnalysis}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Skip analysis and fill form manually
        </button>
      </div>
    </div>
  );

  /**
   * Render preview step
   */
  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Analysis Results
        </h2>
        <p className="text-gray-600">
          Review the AI analysis results and choose how to proceed.
        </p>
      </div>

      {analysisData && (
        <ProjectAnalysisPreview
          analysis={analysisData}
          onConfirm={handleConfirmAnalysis}
          onEdit={handleEditAnalysis}
          onReAnalyze={handleReAnalyze}
          className="mb-6"
        />
      )}

      {/* Navigation */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={handleReAnalyze}>
          Try Different Repository
        </Button>
      </div>
    </div>
  );

  /**
   * Render form step
   */
  const renderFormStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Project Details
          </h2>
          <p className="text-gray-600">
            {analysisData
              ? "Review and complete your project information. Some fields have been pre-filled from the AI analysis."
              : "Fill in your project information manually."}
          </p>
        </div>

        {analysisData && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToAnalysis}
            className="flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Analysis
          </Button>
        )}
      </div>

      {/* Analysis Summary (if available) */}
      {analysisData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            AI Analysis Applied
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Pre-filled description from repository analysis</p>
            <p>
              • Added {analysisData.technologies.length} detected technologies
            </p>
            {analysisData.key_features.length > 0 && (
              <p>
                • Identified {analysisData.key_features.length} key features
              </p>
            )}
          </div>
        </div>
      )}

      <ProjectForm
        eventId={eventId}
        initialData={(enhancedProjectData as Project) || initialData}
        onSubmit={handleFormSubmit}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );

  return (
    <div className="w-full">
      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        {currentStep === "analysis" && renderAnalysisStep()}
        {currentStep === "preview" && renderPreviewStep()}
        {currentStep === "form" && renderFormStep()}
      </div>
    </div>
  );
};

export default ProjectFormWithAnalysis;
