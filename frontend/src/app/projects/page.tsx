/**
 * Projects Page - Server Component
 *
 * Fetches all projects during SSR using DynamoDB.
 * Note: This is an expensive operation as it queries all events first,
 * then gets projects for each event. Consider caching or pagination for production.
 */

import { projectService } from "@/services/projectService";
import { eventService } from "@/services/eventService";
import { prizeAwardService } from "@/services/prizeAwardService";
import { ProjectsClient } from "./ProjectsClient";
import Link from "next/link";
import type { Project } from "@/lib/types/project";

export default async function ProjectsPage() {
  // Fetch both projects and events data for search functionality
  const [projectsResult, eventsResult] = await Promise.all([
    projectService.getAll(),
    eventService.getAll(),
  ]);

  // Handle case where projects data fails to load - this is critical
  if (!projectsResult.success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Unable to Load Projects
            </h1>
            <p className="text-gray-600 mb-8">
              {projectsResult.error || "Please try again later."}
            </p>
            <Link
              href="/projects"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where events data fails to load gracefully - search will still work without event filtering
  const projects = projectsResult.data || [];
  const events = eventsResult.success ? eventsResult.data || [] : [];

  // Log warning if events failed to load but continue with projects
  if (!eventsResult.success) {
    console.warn("Events data failed to load:", eventsResult.error);
  }

  // Enrich projects with prize awards data
  const enrichedProjects: Project[] = await Promise.all(
    projects.map(async (project) => {
      const prizeAwardsResult = await prizeAwardService.getByProject(
        project.id
      );
      const prizeAwards = prizeAwardsResult.success
        ? prizeAwardsResult.data || []
        : [];

      return {
        ...project,
        prizeAwards,
        hasPrizes: prizeAwards.length > 0,
      };
    })
  );

  return <ProjectsClient projects={enrichedProjects} events={events} />;
}
