/**
 * Event Create/Edit Page - Server Component
 * 
 * Fetches event data on the server if in edit mode, then delegates to client component.
 */

import { notFound } from "next/navigation";
import { eventService } from "@/services/eventService";
import { EventCreateClient } from "./EventCreateClient";

interface EventCreatePageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function EventCreatePage({ searchParams }: EventCreatePageProps) {
  const params = await searchParams;
  const eventId = params.id;
  let event = undefined;

  // Load event data if in edit mode
  if (eventId) {
    const { data, error } = await eventService.getById(eventId);
    
    if (error || !data) {
      notFound();
    }
    
    event = data;
  }

  return <EventCreateClient initialEvent={event} eventId={eventId} />;
}


