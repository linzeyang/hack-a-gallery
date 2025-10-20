/**
 * Event Detail Client Component
 * 
 * IMPORTANT: This is a Client Component due to localStorage usage in Phase 1 (MVP).
 * 
 * Why Client Component?
 * - localStorage only works in browser context, not during SSR
 * - Data must be fetched client-side using useEffect
 * - This is temporary and correct for the MVP architecture
 * 
 * Migration to AWS (Phase 2):
 * 1. Move logic back to page.tsx as Server Component
 * 2. Replace useEffect with direct await calls
 * 3. Remove useState for event/projects/loading/error
 * 4. Use Next.js notFound() for error handling
 * 5. Page will automatically SSR with full SEO benefits
 * 
 * See: frontend/docs/STORAGE_MIGRATION_GUIDE.md
 */
"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { eventService } from "@/services/eventService";
import { projectService } from "@/services/projectService";
import { EventDetail } from "@/components/features";
import type { Event } from "@/lib/types/event";
import type { Project } from "@/lib/types/project";

export default function EventDetailClient() {
  const params = useParams();
  const id = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEventData() {
      const { data: eventData, error: eventError } = await eventService.getById(id);

      if (eventError || !eventData) {
        setError(eventError || "Event not found");
        setIsLoading(false);
        return;
      }

      setEvent(eventData);

      const { data: projectsData } = await projectService.getByEvent(id);
      setProjects(projectsData || []);
      setIsLoading(false);
    }

    loadEventData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-4">
                  <div className="h-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EventDetail event={event} projects={projects} />
    </div>
  );
}
