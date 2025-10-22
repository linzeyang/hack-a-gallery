/**
 * Event Detail Page - Server Component
 *
 * This is now a Server Component that fetches data during SSR.
 * Benefits:
 * - Improved SEO with fully rendered HTML
 * - Faster initial page load
 * - Data fetched on the server using DynamoDB
 */

import { notFound } from "next/navigation";
import { eventService } from "@/services/eventService";
import { projectService } from "@/services/projectService";
import { prizeAwardService } from "@/services/prizeAwardService";
import { sortProjectsByPrizeStatus } from "@/lib/utils/prizes";
import { EventDetail } from "@/components/features";

interface EventDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;

  const { data: event, error: eventError } = await eventService.getById(id);

  if (eventError || !event) {
    notFound();
  }

  const { data: projects } = await projectService.getByEvent(id);

  // Fetch prize awards for the event
  const { data: prizeAwards } = await prizeAwardService.getByEvent(id);

  // Enrich projects with their prize awards
  const projectsWithPrizes = (projects || []).map((project) => ({
    ...project,
    prizeAwards: (prizeAwards || []).filter(
      (award) => award.projectId === project.id
    ),
  }));

  // Sort projects to prioritize prize winners first
  const sortedProjects = sortProjectsByPrizeStatus(projectsWithPrizes);

  return (
    <div className="container mx-auto px-4 py-8">
      <EventDetail event={event} projects={sortedProjects} />
    </div>
  );
}
