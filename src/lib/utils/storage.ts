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
 * Phase 1: Returns LocalStorageAdapter for browser-based storage
 * Future Phase 2: Can return ApiStorageAdapter or AwsStorageAdapter based on
 * environment variables (e.g., NEXT_PUBLIC_USE_AWS_STORAGE)
 * 
 * This factory pattern allows seamless migration from localStorage to
 * cloud storage without changing any service layer code.
 * 
 * @returns IStorageAdapter instance
 */
export function getStorageAdapter(): IStorageAdapter {
  // Phase 1: Return localStorage adapter
  // This is the default implementation for MVP
  return new LocalStorageAdapter();

  // Future Phase 2: Switch based on environment
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
