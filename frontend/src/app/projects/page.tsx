/**
 * Projects Page - Server Component
 *
 * Fetches all projects during SSR using DynamoDB.
 * Note: This is an expensive operation as it queries all events first,
 * then gets projects for each event. Consider caching or pagination for production.
 */

import { projectService } from '@/services/projectService';
import { ProjectsClient } from './ProjectsClient';

export default async function ProjectsPage() {
  const { data: projects } = await projectService.getAll();

  return <ProjectsClient projects={projects || []} />;
}
