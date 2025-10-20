import type { IStorageAdapter } from '@/lib/types/storage';

/**
 * LocalStorage Adapter
 * 
 * Phase 1 (MVP) implementation of IStorageAdapter using browser localStorage.
 * Provides type-safe storage operations with JSON serialization.
 * 
 * IMPORTANT: This adapter only works in browser context (client-side).
 * Pages using this adapter MUST be Client Components with "use client" directive.
 * 
 * Limitations:
 * - Cannot be used in Server Components or during SSR
 * - No SEO benefits (data not available during initial render)
 * - Slower initial page load (data fetched after JavaScript loads)
 * - Data stored locally per browser (not shared across devices)
 * 
 * Migration Path:
 * When switching to AWS/API storage, this adapter will be replaced with
 * AwsStorageAdapter or ApiStorageAdapter, allowing pages to become Server
 * Components again and regain SSR benefits.
 * 
 * This adapter can be easily swapped for API or AWS storage adapters
 * without changing any service layer code.
 */
export class LocalStorageAdapter implements IStorageAdapter {
  /**
   * Retrieve a value from localStorage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from localStorage (key: ${key}):`, error);
      return null;
    }
  }

  /**
   * Store a value in localStorage with JSON serialization
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage (key: ${key}):`, error);
      throw error;
    }
  }

  /**
   * Remove a value from localStorage
   */
  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage (key: ${key}):`, error);
      throw error;
    }
  }

  /**
   * Clear all values from localStorage
   */
  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw error;
    }
  }

  /**
   * Retrieve all values with keys matching a prefix
   */
  async getAll<T>(prefix: string): Promise<T[]> {
    try {
      const items: T[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          const item = await this.get<T>(key);
          if (item !== null) {
            items.push(item);
          }
        }
      }
      return items;
    } catch (error) {
      console.error(`Error getting all items from localStorage (prefix: ${prefix}):`, error);
      return [];
    }
  }
}
