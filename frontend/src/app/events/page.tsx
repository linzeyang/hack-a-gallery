/**
 * Events Listing Page - Server Component
 *
 * This is now a Server Component that fetches data during SSR.
 * Benefits:
 * - Improved SEO with fully rendered HTML
 * - Faster initial page load
 * - Data fetched on the server using DynamoDB
 */

import { eventService } from "@/services/eventService";
import { EventsList } from "@/components/features";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.events');
  
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EventsPage() {
  const { data: events, error } = await eventService.getAll();

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
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Hackathon Events
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Discover upcoming hackathons and showcase your projects
        </p>
      </div>

      <EventsList events={events || []} />
    </div>
  );
}
