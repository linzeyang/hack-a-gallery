/**
 * Storage Adapter Interface
 * 
 * Generic interface for storage operations that can be implemented
 * by different storage backends (localStorage, API, S3, DynamoDB, etc.)
 * 
 * This abstraction allows seamless migration from localStorage to
 * cloud storage without changing service layer code.
 */
export interface IStorageAdapter {
  /**
   * Retrieve a value from storage by key
   * @param key - Storage key
   * @returns Promise resolving to the stored value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Store a value in storage
   * @param key - Storage key
   * @param value - Value to store
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Remove a value from storage by key
   * @param key - Storage key
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all values from storage
   */
  clear(): Promise<void>;

  /**
   * Retrieve all values with keys matching a prefix
   * @param prefix - Key prefix to filter by
   * @returns Promise resolving to array of matching values
   */
  getAll<T>(prefix: string): Promise<T[]>;
}
