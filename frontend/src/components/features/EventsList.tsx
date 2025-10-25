'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EventCard } from './EventCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { Event } from '@/lib/types/event';

export interface EventsListProps {
  events: Event[];
}

export const EventsList: React.FC<EventsListProps> = ({ events }) => {
  const router = useRouter();
  const t = useTranslations('events');

  if (events.length === 0) {
    return (
      <EmptyState
        title={t('noEvents')}
        description={t('noEventsDescription')}
        actionLabel={t('createEvent')}
        onAction={() => router.push('/events/create')}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4 sm:mb-6">
        <Button onClick={() => router.push('/events/create')} aria-label={t('createEvent')}>
          {t('createEvent')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" role="list">
        {events.map((event) => (
          <div key={event.id} role="listitem">
            <EventCard
              event={event}
              onClick={() => router.push(`/events/${event.id}`)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
