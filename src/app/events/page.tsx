/**
 * Events Listing Page
 * 
 * IMPORTANT: This is a Client Component due to localStorage usage in Phase 1 (MVP).
 * 
 * Why Client Component?
 * - localStorage only works in browser context, not during SSR
 * - Data must be fetched client-side using useEffect
 * - This is temporary and correct for the MVP architecture
 * 
 * Migration to AWS (Phase 2):
 * 1. Remove "use client" directive
 * 2. Convert to async Server Component
 * 3. Replace useEffect with direct await eventService.getAll()
 * 4. Remove useState for events/loading/error
 * 5. Page will automatically SSR with full SEO benefits
 * 
 * See: frontend/docs/STORAGE_MIGRATION_GUIDE.md
 */
"use client";

import { useEffect, useState } from "react";
import { eventService } from "@/services/eventService";
import { EventsList } from "@/components/features";
import type { Event } from "@/lib/types/event";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await eventService.getAll();
      if (error) {
        setError(error);
      } else {
        setEvents(data || []);
      }
      setIsLoading(false);
    }
    loadEvents();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-6 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="h-48 bg-gray-200 animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Events
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Hackathon Events
        </h1>
        <p className="text-gray-600">
          Discover upcoming hackathons and showcase your projects
        </p>
      </div>

      <EventsList events={events || []} />
    </div>
  );
}
