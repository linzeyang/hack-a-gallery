import type { IEventService, ServiceResponse } from '@/lib/types/service';
import type { Event } from '@/lib/types/event';
import { getStorageAdapter } from '@/lib/utils/storage';

/**
 * Event Service Implementation
 * 
 * Provides CRUD operations for hackathon events using the storage adapter pattern.
 * This service is agnostic to the storage implementation (localStorage, DynamoDB, etc.)
 * and can be easily migrated by changing only the storage adapter.
 * 
 * DynamoDB Key Pattern:
 * - Individual event: "event:eventId" → PK: "EVENT#eventId", SK: "METADATA"
 * - All events: "event:" prefix for getAll() operation
 * 
 * All operations return ServiceResponse for consistent error handling.
 */
class EventService implements IEventService {
  private storage = getStorageAdapter();

  /**
   * Get all non-hidden events
   * 
   * Uses DynamoDB Query with "event:" prefix to retrieve all events.
   * The adapter will use Scan with filter: begins_with(PK, "EVENT#") AND SK = "METADATA"
   */
  async getAll(): Promise<ServiceResponse<Event[]>> {
    try {
      const events = await this.storage.getAll<Event>('event:');
      const filteredEvents = events.filter((e) => !e.isHidden);
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
   * 
   * Uses DynamoDB GetCommand with key "event:eventId"
   * Maps to PK: "EVENT#eventId", SK: "METADATA"
   */
  async getById(id: string): Promise<ServiceResponse<Event>> {
    try {
      const event = await this.storage.get<Event>(`event:${id}`);

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
   * 
   * Uses DynamoDB PutCommand with key "event:eventId"
   * The adapter will:
   * - Map to PK: "EVENT#eventId", SK: "METADATA"
   * - Add GSI1 keys: GSI1PK: "ORGANIZER#organizerId", GSI1SK: "EVENT#eventId"
   * - Add timestamps: createdAt, updatedAt
   */
  async create(
    eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceResponse<Event>> {
    try {
      const newEvent: Event = {
        ...eventData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.storage.set(`event:${newEvent.id}`, newEvent);

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
   * 
   * Uses DynamoDB GetCommand followed by PutCommand
   * The adapter will automatically update the updatedAt timestamp
   */
  async update(id: string, eventData: Partial<Event>): Promise<ServiceResponse<Event>> {
    try {
      const existingEvent = await this.storage.get<Event>(`event:${id}`);

      if (!existingEvent) {
        return {
          success: false,
          error: 'Event not found',
        };
      }

      const updatedEvent: Event = {
        ...existingEvent,
        ...eventData,
        id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
      };

      await this.storage.set(`event:${id}`, updatedEvent);

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
   * 
   * Uses DynamoDB Query with "event:" prefix and filters by organizerId
   * In the future, this could be optimized to use GSI1 with:
   * GSI1PK: "ORGANIZER#organizerId", GSI1SK begins_with "EVENT#"
   * 
   * For now, we retrieve all events and filter client-side for simplicity.
   */
  async getByOrganizer(organizerId: string): Promise<ServiceResponse<Event[]>> {
    try {
      const events = await this.storage.getAll<Event>('event:');
      const organizerEvents = events.filter((e) => e.organizerId === organizerId);

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
