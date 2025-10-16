/**
 * Project Detail Page - Server Component
 *
 * This is now a Server Component that fetches data during SSR.
 * Benefits:
 * - Improved SEO with fully rendered HTML
 * - Faster initial page load
 * - Data fetched on the server using DynamoDB
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { projectService } from "@/services/projectService";
import { eventService } from "@/services/eventService";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;

  const projectResponse = await projectService.getById(id);

  if (!projectResponse.success || !projectResponse.data) {
    notFound();
  }

  const project = projectResponse.data;

  // Fetch associated event data
  const eventResponse = await eventService.getById(project.eventId);
  const event = eventResponse.success ? eventResponse.data : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/events"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
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
            Back to Events
          </Link>
        </div>

        {/* Project Header */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
              {project.name}
            </h1>
            {event && (
              <Link
                href={`/events/${event.id}`}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
              >
                Part of {event.name} →
              </Link>
            )}
          </CardHeader>
          <CardBody className="p-4 sm:p-6">
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
          </CardBody>
        </Card>

        {/* Links */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Project Links
            </h2>
          </CardHeader>
          <CardBody className="p-4 sm:p-6">
            <div className="space-y-3">
              {/* GitHub URL */}
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-500">
                    GitHub Repository
                  </p>
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:underline break-all"
                  >
                    {project.githubUrl}
                  </a>
                </div>
              </div>

              {/* Demo URL */}
              {project.demoUrl && (
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Live Demo
                    </p>
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:underline break-all"
                    >
                      {project.demoUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                View on GitHub
              </a>
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
                >
                  View Demo
                </a>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Technologies */}
        {project.technologies.length > 0 && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Technologies Used
              </h2>
            </CardHeader>
            <CardBody className="p-4 sm:p-6">
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Team Members */}
        {project.teamMembers.length > 0 && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Team Members
              </h2>
            </CardHeader>
            <CardBody className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {project.teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-h-[72px]"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-base sm:text-lg font-semibold flex-shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                        {member.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {member.role}
                      </p>
                      {member.githubUsername && (
                        <a
                          href={`https://github.com/${member.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate block"
                        >
                          @{member.githubUsername}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Associated Event Info */}
        {event && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Event Information
              </h2>
            </CardHeader>
            <CardBody className="p-4 sm:p-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Event Name
                  </p>
                  <Link
                    href={`/events/${event.id}`}
                    className="text-base sm:text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline break-words"
                  >
                    {event.name}
                  </Link>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Location
                  </p>
                  <p className="text-sm sm:text-base text-gray-900">
                    {event.location}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Dates</p>
                  <p className="text-sm sm:text-base text-gray-900">
                    {new Date(event.startDate).toLocaleDateString()} -{" "}
                    {new Date(event.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
