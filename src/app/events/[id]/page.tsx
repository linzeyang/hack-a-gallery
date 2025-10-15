/**
 * Event Detail Page - Server Component Wrapper
 * 
 * This is a Server Component that handles static export configuration
 * and renders the Client Component for actual data fetching.
 * 
 * For static export with dynamic routes, we need generateStaticParams
 * but can't use it in client components. This wrapper solves that.
 */

import EventDetailClient from './EventDetailClient';

// Required for static export with dynamic routes
// Since we use localStorage (Phase 1), we can't pre-render specific IDs at build time
// We generate a placeholder page - actual data is loaded client-side
export async function generateStaticParams() {
  // Return a placeholder - actual routes are handled client-side
  return [{ id: 'placeholder' }];
}

export default function EventDetailPage() {
  return <EventDetailClient />;
}
