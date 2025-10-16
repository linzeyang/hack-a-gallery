/**
 * Project Submit/Edit Page - Server Component
 * 
 * Fetches event and project data on the server, then delegates to client component.
 */

import { notFound } from 'next/navigation';
import { projectService } from '@/services/projectService';
import { eventService } from '@/services/eventService';
import { ProjectSubmitClient } from './ProjectSubmitClient';

interface ProjectSubmitPageProps {
  searchParams: Promise<{
    eventId?: string;
    projectId?: string;
  }>;
}

export default async function ProjectSubmitPage({ searchParams }: ProjectSubmitPageProps) {
  const params = await searchParams;
  const eventId = params.eventId;
  const projectId = params.projectId;

  // Validate eventId is provided
  if (!eventId) {
    notFound();
  }

  // Fetch event data
  const eventResponse = await eventService.getById(eventId);
  if (!eventResponse.success || !eventResponse.data) {
    notFound();
  }
  const event = eventResponse.data;

  // If editing, fetch project data
  let project = undefined;
  if (projectId) {
    const projectResponse = await projectService.getById(projectId);
    if (!projectResponse.success || !projectResponse.data) {
      notFound();
    }
    project = projectResponse.data;
  }

  return <ProjectSubmitClient event={event} initialProject={project} />;
}
