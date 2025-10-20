"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProjectFormWithAnalysis } from "@/components/features/ProjectFormWithAnalysis";
import type { Project } from "@/lib/types/project";
import type { Event } from "@/lib/types/event";

interface ProjectSubmitClientProps {
  event: Event;
  initialProject?: Project;
}

export function ProjectSubmitClient({
  event,
  initialProject,
}: ProjectSubmitClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!initialProject;

  const handleSubmit = async (
    data: Omit<Project, "id" | "createdAt" | "updatedAt">
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url =
        isEditMode && initialProject
          ? `/api/projects/${initialProject.id}`
          : "/api/projects";
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const project = await response.json();
        // Navigate to project detail page on success
        router.push(`/projects/${project.id}`);
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Failed to submit project. Please try again."
        );
        setIsSubmitting(false);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/events/${event.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
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
            Back to Event
          </button>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? "Edit Project" : "Submit Your Project"}
          </h1>
          <p className="text-gray-600">
            For{" "}
            <Link
              href={`/events/${event.id}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {event.name}
            </Link>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Project Form with AI Analysis */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <ProjectFormWithAnalysis
            eventId={event.id}
            initialData={initialProject}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Enhanced with AI Analysis:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>
              Use AI analysis to automatically detect technologies and generate
              descriptions
            </li>
            <li>Get intelligent suggestions for project tags and categories</li>
            <li>Extract key features from your repository automatically</li>
            <li>
              Save time with pre-filled form fields based on code analysis
            </li>
            <li>Or skip analysis and fill the form manually if you prefer</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
