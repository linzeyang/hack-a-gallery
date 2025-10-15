'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { EventCard } from './EventCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { Event } from '@/lib/types/event';

export interface EventsListProps {
  events: Event[];
}

export const EventsList: React.FC<EventsListProps> = ({ events }) => {
  const router = useRouter();

  if (events.length === 0) {
    return (
      <EmptyState
        title="No Events Yet"
        description="Be the first to create a hackathon event and start accepting project submissions!"
        actionLabel="Create Event"
        onAction={() => router.push('/events/create')}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button onClick={() => router.push('/events/create')}>
          Create Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onClick={() => router.push(`/events/${event.id}`)}
          />
        ))}
      </div>
    </div>
  );
};
