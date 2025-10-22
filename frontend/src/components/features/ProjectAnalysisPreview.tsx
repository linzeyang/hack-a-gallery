/**
 * ProjectAnalysisPreview Component
 *
 * Preview card component for displaying project analysis results.
 * Shows summary, technology tags, key features, and action buttons.
 */

"use client";

import React from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  getTechnologyColor,
  getTagColor,
  formatProcessingTime,
} from "@/services/analysisService";
import type { AnalysisPreviewProps } from "@/lib/types/analysis";

/**
 * Technology Tag Component
 */
const TechnologyTag: React.FC<{
  name: string;
  category: string;
  confidence: number;
}> = ({ name, category, confidence }) => {
  const colorClass = getTechnologyColor(category);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}
      title={`${category} • ${Math.round(confidence * 100)}% confidence`}
    >
      {name}
      <span className="text-xs opacity-75">
        {Math.round(confidence * 100)}%
      </span>
    </span>
  );
};

/**
 * Category Tag Component
 */
const CategoryTag: React.FC<{
  name: string;
  category: string;
  confidence?: number;
}> = ({ name, category, confidence }) => {
  const colorClass = getTagColor(category);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}
      title={
        confidence !== undefined
          ? `${category} • ${Math.round(confidence * 100)}% confidence`
          : category
      }
    >
      {name}
      {confidence !== undefined && (
        <span className="text-xs opacity-75">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </span>
  );
};

/**
 * Key Feature Item Component
 */
const KeyFeatureItem: React.FC<{ feature: string }> = ({ feature }) => (
  <li className="flex items-start gap-2">
    <svg
      className="w-4 h-4 text-green-500 shrink-0 mt-0.5"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
    <span className="text-sm text-gray-700">{feature}</span>
  </li>
);

/**
 * Empty State Component
 */
const EmptySection: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
}> = ({ title, description, icon }) => (
  <div className="text-center py-6">
    <div className="flex justify-center mb-2">{icon}</div>
    <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
    <p className="text-xs text-gray-500">{description}</p>
  </div>
);

/**
 * ProjectAnalysisPreview Component
 */
export const ProjectAnalysisPreview: React.FC<AnalysisPreviewProps> = ({
  analysis,
  repositoryUrl,
  isLoading = false,
  onConfirm,
  onEdit,
  onReAnalyze,
  className = "",
}) => {
  const { summary, technologies, tags, key_features, metadata } = analysis;

  // Extract owner/repo from GitHub URL
  const getRepoIdentifier = (url?: string) => {
    if (!url) return null;
    const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
    return match ? match[1].replace(/\.git$/, "") : null;
  };

  const repoId = getRepoIdentifier(repositoryUrl);

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Project Analysis Results
                </h2>
                {repoId && (
                  <a
                    href={repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    {repoId}
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Agent: {metadata.agent_name}</span>
              <span>•</span>
              <span>
                Processing time:{" "}
                {formatProcessingTime(metadata.processing_time_ms)}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Analysis Complete
            </span>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Project Summary */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Project Summary
          </h3>
          {summary ? (
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          ) : (
            <EmptySection
              title="No Summary Available"
              description="The AI agent couldn't generate a summary for this repository."
              icon={
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            />
          )}
        </div>

        {/* Technologies */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Technologies Detected
          </h3>
          {technologies && technologies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech, index) => (
                <TechnologyTag
                  key={`${tech.name}-${index}`}
                  name={tech.name}
                  category={tech.category}
                  confidence={tech.confidence}
                />
              ))}
            </div>
          ) : (
            <EmptySection
              title="No Technologies Detected"
              description="The AI agent couldn't identify specific technologies in this repository."
              icon={
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              }
            />
          )}
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Project Tags
          </h3>
          {tags && tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <CategoryTag
                  key={`${tag.name}-${index}`}
                  name={tag.name}
                  category={tag.category}
                  confidence={tag.confidence}
                />
              ))}
            </div>
          ) : (
            <EmptySection
              title="No Tags Generated"
              description="The AI agent couldn't generate categorization tags for this repository."
              icon={
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              }
            />
          )}
        </div>

        {/* Key Features */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Key Features
          </h3>
          {key_features && key_features.length > 0 ? (
            <ul className="space-y-2">
              {key_features.map((feature, index) => (
                <KeyFeatureItem key={index} feature={feature} />
              ))}
            </ul>
          ) : (
            <EmptySection
              title="No Key Features Identified"
              description="The AI agent couldn't extract specific features from this repository."
              icon={
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              }
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          {onConfirm && (
            <Button
              variant="primary"
              size="md"
              onClick={() => onConfirm(analysis)}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Confirm & Use
            </Button>
          )}

          {onReAnalyze && (
            <Button
              variant="secondary"
              size="md"
              onClick={onReAnalyze}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Re-analyze
            </Button>
          )}
        </div>

        {/* Analysis Timestamp */}
        <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
          Analysis completed on {new Date(metadata.timestamp).toLocaleString()}
        </div>
      </CardBody>
    </Card>
  );
};

export default ProjectAnalysisPreview;
