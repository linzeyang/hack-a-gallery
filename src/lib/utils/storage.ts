import type { IStorageAdapter } from '@/lib/types/storage';
import { LocalStorageAdapter } from '@/lib/adapters/localStorageAdapter';

/**
 * Storage Keys
 * 
 * Centralized storage key constants to ensure consistency
 * across the application.
 */
export const STORAGE_KEYS = {
  EVENTS: 'hackagallery_events',
  PROJECTS: 'hackagallery_projects',
  CURRENT_USER: 'hackagallery_user',
} as const;

/**
 * Storage Factory
 * 
 * Returns the appropriate storage adapter based on environment configuration.
 * 
 * Phase 1 (MVP): Returns LocalStorageAdapter for browser-based storage
 * Phase 2 (Production): Can return ApiStorageAdapter or AwsStorageAdapter
 * 
 * IMPORTANT ARCHITECTURAL NOTE:
 * ============================
 * The localStorage adapter requires pages to be Client Components ("use client")
 * because localStorage is only available in the browser, not during SSR.
 * 
 * When migrating to AWS/API storage:
 * 1. Create AwsStorageAdapter implementing IStorageAdapter
 * 2. Update this function to return the new adapter
 * 3. Remove "use client" directives from pages (e.g., /events/page.tsx)
 * 4. Pages will automatically become Server Components again
 * 5. Regain SSR benefits: better performance, SEO, static generation
 * 
 * The service layer (eventService, projectService) remains unchanged during
 * migration - only the storage adapter and page rendering strategy change.
 * 
 * Migration Checklist:
 * - [ ] Implement AwsStorageAdapter with IStorageAdapter interface
 * - [ ] Update getStorageAdapter() to return new adapter
 * - [ ] Remove "use client" from: /events/page.tsx, /events/[id]/page.tsx
 * - [ ] Convert useEffect data fetching back to async Server Component pattern
 * - [ ] Test SSR functionality
 * - [ ] Remove API route handlers if created (optional)
 * 
 * @returns IStorageAdapter instance
 */
export function getStorageAdapter(): IStorageAdapter {
  // Phase 1: Return localStorage adapter (requires Client Components)
  // This is the default implementation for MVP
  return new LocalStorageAdapter();

  // Phase 2: Switch based on environment (enables Server Components)
  // Uncomment and configure when ready to migrate to AWS
  /*
  if (process.env.NEXT_PUBLIC_USE_AWS_STORAGE === 'true') {
    return new AwsStorageAdapter();
  }
  if (process.env.NEXT_PUBLIC_USE_API === 'true') {
    return new ApiStorageAdapter();
  }
  return new LocalStorageAdapter();
  */
}
