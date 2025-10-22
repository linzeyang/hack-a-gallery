/**
 * Projects Page - Server Component
 *
 * Fetches all projects during SSR using DynamoDB.
 * Note: This is an expensive operation as it queries all events first,
 * then gets projects for each event. Consider caching or pagination for production.
 */

import { projectService } from "@/services/projectService";
import { eventService } from "@/services/eventService";
import { ProjectsClient } from "./ProjectsClient";

export default async function ProjectsPage() {
  // Fetch both projects and events data for search functionality
  const [projectsResult, eventsResult] = await Promise.all([
    projectService.getAll(),
    eventService.getAll(),
  ]);

  return (
    <ProjectsClient
      projects={projectsResult.data || []}
      events={eventsResult.data || []}
    />
  );
}
