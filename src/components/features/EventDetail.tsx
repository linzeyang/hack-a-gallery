'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Event } from '@/lib/types/event';
import type { Project } from '@/lib/types/project';

export interface EventDetailProps {
  event: Event;
  projects: Project[];
}

export const EventDetail: React.FC<EventDetailProps> = ({ event, projects }) => {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Back Button */}
      <Button variant="outline" onClick={() => router.push('/events')} className="text-sm sm:text-base">
        ← Back to Events
      </Button>

      {/* Event Header */}
      <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-4 sm:p-6 md:p-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 break-words px-2">{event.name}</h1>
            <p className="text-base sm:text-lg md:text-xl opacity-90">{event.location}</p>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold">About This Event</h2>
            </CardHeader>
            <CardBody className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </CardBody>
          </Card>

          {event.requirements && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold">Requirements</h2>
              </CardHeader>
              <CardBody className="p-4 sm:p-6">
                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{event.requirements}</p>
              </CardBody>
            </Card>
          )}

          {/* Prizes */}
          {event.prizes.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold">Prizes</h2>
              </CardHeader>
              <CardBody className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {event.prizes.map((prize, index) => (
                    <div
                      key={index}
                      className="p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 transition-all duration-150 ease-in-out hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {prize.title}
                        </h3>
                        <span className="text-lg sm:text-xl font-bold text-orange-600 flex-shrink-0">
                          {prize.amount}
                        </span>
                      </div>
                      {prize.description && (
                        <p className="text-sm sm:text-base text-gray-700">{prize.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold">Event Details</h2>
            </CardHeader>
            <CardBody className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium">Start Date</span>
                </div>
                <p className="text-gray-900 ml-7">{formatDate(event.startDate)}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium">End Date</span>
                </div>
                <p className="text-gray-900 ml-7">{formatDate(event.endDate)}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="font-medium">Location</span>
                </div>
                <p className="text-gray-900 ml-7">{event.location}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="font-medium">Organizer</span>
                </div>
                <p className="text-gray-900 ml-7">{event.organizerName}</p>
              </div>
            </CardBody>
          </Card>

          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push(`/projects/submit?eventId=${event.id}`)}
            aria-label={`Submit a project for ${event.name}`}
          >
            Submit Project
          </Button>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Submitted Projects</h2>
        {projects.length === 0 ? (
          <EmptyState
            title="No Projects Yet"
            description="Be the first to submit a project for this hackathon!"
            actionLabel="Submit Project"
            onAction={() => router.push(`/projects/submit?eventId=${event.id}`)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                hover
                className="cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardBody className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-2">{project.name}</h3>
                  <p className="text-sm sm:text-base text-gray-700 mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {project.technologies.slice(0, 3).map((tech, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full transition-colors duration-150 ease-in-out"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{project.technologies.length - 3} more
                      </span>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
