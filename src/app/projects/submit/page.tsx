'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProjectForm } from '@/components/features/ProjectForm';
import { projectService } from '@/services/projectService';
import { eventService } from '@/services/eventService';
import type { Project } from '@/lib/types/project';
import type { Event } from '@/lib/types/event';

export default function ProjectSubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const projectId = searchParams.get('projectId');

  const [project, setProject] = useState<Project | undefined>(undefined);
  const [event, setEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isEditMode = !!projectId;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      // Validate eventId is provided
      if (!eventId) {
        setError('Event ID is required. Please select an event first.');
        setIsLoading(false);
        return;
      }

      // Fetch event data
      const eventResponse = await eventService.getById(eventId);
      if (!eventResponse.success || !eventResponse.data) {
        setError('Event not found. Please select a valid event.');
        setIsLoading(false);
        return;
      }
      setEvent(eventResponse.data);

      // If editing, fetch project data
      if (projectId) {
        const projectResponse = await projectService.getById(projectId);
        if (!projectResponse.success || !projectResponse.data) {
          setError('Project not found.');
          setIsLoading(false);
          return;
        }
        setProject(projectResponse.data);
      }

      setIsLoading(false);
    };

    loadData();
  }, [eventId, projectId]);

  const handleSubmit = async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let response;

      if (isEditMode && projectId) {
        // Update existing project
        response = await projectService.update(projectId, data);
      } else {
        // Create new project
        response = await projectService.create(data);
      }

      if (response.success && response.data) {
        // Navigate to project detail page on success
        router.push(`/projects/${response.data.id}`);
      } else {
        setError(response.error || 'Failed to submit project. Please try again.');
        setIsSubmitting(false);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (eventId) {
      router.push(`/events/${eventId}`);
    } else {
      router.push('/events');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Error</h2>
              <p className="mt-2 text-gray-600">{error}</p>
              <div className="mt-6">
                <Link
                  href="/events"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Event
          </button>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? 'Edit Project' : 'Submit Your Project'}
          </h1>
          {event && (
            <p className="text-gray-600">
              For{' '}
              <Link href={`/events/${event.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                {event.name}
              </Link>
            </p>
          )}
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

        {/* Project Form */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          {eventId && (
            <ProjectForm
              eventId={eventId}
              initialData={project}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Tips for a great submission:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Write a clear, concise description of what your project does</li>
            <li>Include all technologies and frameworks you used</li>
            <li>Make sure your GitHub repository is public</li>
            <li>Add a README with setup instructions</li>
            <li>Include screenshots or a demo video if possible</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
