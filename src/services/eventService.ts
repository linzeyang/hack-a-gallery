import type { IEventService, ServiceResponse } from '@/lib/types/service';
import type { Event } from '@/lib/types/event';
import { getStorageAdapter, STORAGE_KEYS } from '@/lib/utils/storage';

/**
 * Event Service Implementation
 * 
 * Provides CRUD operations for hackathon events using the storage adapter pattern.
 * This service is agnostic to the storage implementation (localStorage, API, AWS, etc.)
 * and can be easily migrated by changing only the storage adapter.
 * 
 * All operations return ServiceResponse for consistent error handling.
 */
class EventService implements IEventService {
  private storage = getStorageAdapter();

  /**
   * Get all non-hidden events
   */
  async getAll(): Promise<ServiceResponse<Event[]>> {
    try {
      const events = await this.storage.get<Event[]>(STORAGE_KEYS.EVENTS);
      const filteredEvents = (events || []).filter((e) => !e.isHidden);
      return {
        success: true,
        data: filteredEvents,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch events',
      };
    }
  }

  /**
   * Get event by ID
   */
  async getById(id: string): Promise<ServiceResponse<Event>> {
    try {
      const events = await this.storage.get<Event[]>(STORAGE_KEYS.EVENTS);
      const event = (events || []).find((e) => e.id === id);

      if (!event) {
        return {
          success: false,
          error: 'Event not found',
        };
      }

      return {
        success: true,
        data: event,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch event',
      };
    }
  }

  /**
   * Create a new event
   */
  async create(
    eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceResponse<Event>> {
    try {
      const events = await this.storage.get<Event[]>(STORAGE_KEYS.EVENTS);
      const existingEvents = events || [];

      const newEvent: Event = {
        ...eventData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedEvents = [...existingEvents, newEvent];
      await this.storage.set(STORAGE_KEYS.EVENTS, updatedEvents);

      return {
        success: true,
        data: newEvent,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create event',
      };
    }
  }

  /**
   * Update an existing event
   */
  async update(id: string, eventData: Partial<Event>): Promise<ServiceResponse<Event>> {
    try {
      const events = await this.storage.get<Event[]>(STORAGE_KEYS.EVENTS);
      const existingEvents = events || [];

      const eventIndex = existingEvents.findIndex((e) => e.id === id);

      if (eventIndex === -1) {
        return {
          success: false,
          error: 'Event not found',
        };
      }

      const updatedEvent: Event = {
        ...existingEvents[eventIndex],
        ...eventData,
        id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
      };

      existingEvents[eventIndex] = updatedEvent;
      await this.storage.set(STORAGE_KEYS.EVENTS, existingEvents);

      return {
        success: true,
        data: updatedEvent,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update event',
      };
    }
  }

  /**
   * Hide an event (soft delete)
   */
  async hide(id: string): Promise<ServiceResponse<void>> {
    try {
      const result = await this.update(id, { isHidden: true });

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to hide event',
      };
    }
  }

  /**
   * Get all events by organizer ID
   */
  async getByOrganizer(organizerId: string): Promise<ServiceResponse<Event[]>> {
    try {
      const events = await this.storage.get<Event[]>(STORAGE_KEYS.EVENTS);
      const organizerEvents = (events || []).filter((e) => e.organizerId === organizerId);

      return {
        success: true,
        data: organizerEvents,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch organizer events',
      };
    }
  }

  /**
   * Generate a unique ID for new events
   * In production, this would be handled by the backend
   */
  private generateId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const eventService = new EventService();
