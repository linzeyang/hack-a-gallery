import type { IPrizeAwardService, ServiceResponse } from "@/lib/types/service";
import type { PrizeAward } from "@/lib/types/prize";
import { getStorageAdapter } from "@/lib/utils/storage";

/**
 * Prize Award Service Implementation
 *
 * Manages the association between projects and prizes they have won.
 * Handles prize capacity validation, duplicate prevention, and maintains
 * prize winner counts.
 *
 * DynamoDB Key Pattern:
 * - Individual award: "prize-award:eventId:prizeId:projectId" →
 *   PK: "EVENT#eventId", SK: "PRIZE-AWARD#prizeId#projectId"
 * - All awards for event: "prize-award:eventId:" prefix
 * - All awards for prize: "prize-award:eventId:prizeId:" prefix
 * - GSI1 for project queries: GSI1PK: "PROJECT#projectId", GSI1SK: "PRIZE-AWARD#prizeId"
 *
 * All operations return ServiceResponse for consistent error handling.
 */
class PrizeAwardService implements IPrizeAwardService {
  private storage = getStorageAdapter();

  /**
   * Generate a unique ID for new prize awards
   */
  private generateId(): string {
    return `award_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Create a new prize award
   *
   * Validates prize capacity and checks for duplicates before creating.
   * Updates the prize's currentWinners count in the event.
   */
  async create(
    award: Omit<PrizeAward, "id" | "awardedAt">
  ): Promise<ServiceResponse<PrizeAward>> {
    try {
      const { eventId, prizeId, projectId } = award;

      // Check if prize can be awarded (has available slots)
      const canAwardResult = await this.canAwardPrize(eventId, prizeId);
      if (!canAwardResult.success) {
        return {
          success: false,
          error: canAwardResult.error,
        };
      }

      if (!canAwardResult.data) {
        return {
          success: false,
          error:
            "This prize has already been awarded to the maximum number of projects.",
        };
      }

      // Check for duplicate award (same project + prize)
      const existingAward = await this.storage.get<PrizeAward>(
        `prize-award:${eventId}:${prizeId}:${projectId}`
      );

      if (existingAward) {
        return {
          success: false,
          error: "This project has already won this prize.",
        };
      }

      // Create the prize award
      const newAward: PrizeAward = {
        ...award,
        id: this.generateId(),
        awardedAt: new Date().toISOString(),
      };

      await this.storage.set(
        `prize-award:${eventId}:${prizeId}:${projectId}`,
        newAward
      );

      // Update prize currentWinners count in event
      const { eventService } = await import("./eventService");
      const eventResult = await eventService.getById(eventId);

      if (eventResult.success && eventResult.data) {
        const event = eventResult.data;
        const updatedPrizes = event.prizes.map((prize) => {
          if (prize.id === prizeId) {
            return {
              ...prize,
              currentWinners: prize.currentWinners + 1,
            };
          }
          return prize;
        });

        await eventService.update(eventId, { prizes: updatedPrizes });
      }

      return {
        success: true,
        data: newAward,
      };
    } catch (error) {
      console.error("PrizeAwardService.create error:", error);
      return {
        success: false,
        error: "Unable to create prize award. Please try again later.",
      };
    }
  }

  /**
   * Get all prize awards for a specific project
   *
   * Uses GSI1 query pattern: GSI1PK = PROJECT#projectId
   * Note: Since GSI queries aren't directly exposed, we query all events
   * and filter by projectId. This could be optimized in the future.
   */
  async getByProject(
    projectId: string
  ): Promise<ServiceResponse<PrizeAward[]>> {
    try {
      this.log("info", `Getting prize awards for project: ${projectId}`);

      // Get all events to query their prize awards
      const { eventService } = await import("./eventService");
      const eventsResult = await eventService.getAll();

      if (!eventsResult.success || !eventsResult.data) {
        return {
          success: false,
          error: "Unable to load prize awards. Please try again later.",
        };
      }

      // Query prize awards for each event and filter by projectId
      const allAwards: PrizeAward[] = [];
      for (const event of eventsResult.data) {
        const eventAwards = await this.storage.getAll<PrizeAward>(
          `prize-award:${event.id}:`
        );
        const projectAwards = eventAwards.filter(
          (award) => award.projectId === projectId
        );
        allAwards.push(...projectAwards);
      }

      return {
        success: true,
        data: allAwards,
      };
    } catch (error) {
      console.error("PrizeAwardService.getByProject error:", error);
      return {
        success: false,
        error:
          "Unable to load prize awards for project. Please try again later.",
      };
    }
  }

  /**
   * Get all prize awards for a specific prize
   *
   * Uses Query with pattern: prize-award:eventId:prizeId:
   */
  async getByPrize(
    eventId: string,
    prizeId: string
  ): Promise<ServiceResponse<PrizeAward[]>> {
    try {
      this.log(
        "info",
        `Getting prize awards for prize: ${prizeId} in event: ${eventId}`
      );

      const awards = await this.storage.getAll<PrizeAward>(
        `prize-award:${eventId}:${prizeId}:`
      );

      return {
        success: true,
        data: awards,
      };
    } catch (error) {
      console.error("PrizeAwardService.getByPrize error:", error);
      return {
        success: false,
        error: "Unable to load prize awards. Please try again later.",
      };
    }
  }

  /**
   * Get all prize awards for a specific event
   *
   * Uses Query with pattern: prize-award:eventId:
   */
  async getByEvent(eventId: string): Promise<ServiceResponse<PrizeAward[]>> {
    try {
      this.log("info", `Getting prize awards for event: ${eventId}`);

      const awards = await this.storage.getAll<PrizeAward>(
        `prize-award:${eventId}:`
      );

      return {
        success: true,
        data: awards,
      };
    } catch (error) {
      console.error("PrizeAwardService.getByEvent error:", error);
      return {
        success: false,
        error: "Unable to load prize awards for event. Please try again later.",
      };
    }
  }

  /**
   * Log helper for consistent logging
   */
  private log(
    level: "info" | "warn" | "error",
    message: string,
    data?: unknown
  ): void {
    const logData = data ? { ...data } : {};
    console[level](`[PrizeAwardService] ${message}`, logData);
  }

  /**
   * Remove a prize award
   *
   * Deletes the prize award and updates the prize's currentWinners count.
   */
  async remove(
    eventId: string,
    prizeId: string,
    projectId: string
  ): Promise<ServiceResponse<void>> {
    try {
      this.log("info", `Removing prize award`, { eventId, prizeId, projectId });

      // Check if award exists
      const existingAward = await this.storage.get<PrizeAward>(
        `prize-award:${eventId}:${prizeId}:${projectId}`
      );

      if (!existingAward) {
        return {
          success: false,
          error: "Prize award not found.",
        };
      }

      // Remove the prize award
      await this.storage.remove(
        `prize-award:${eventId}:${prizeId}:${projectId}`
      );

      // Update prize currentWinners count in event
      const { eventService } = await import("./eventService");
      const eventResult = await eventService.getById(eventId);

      if (eventResult.success && eventResult.data) {
        const event = eventResult.data;
        const updatedPrizes = event.prizes.map((prize) => {
          if (prize.id === prizeId) {
            return {
              ...prize,
              currentWinners: Math.max(0, prize.currentWinners - 1),
            };
          }
          return prize;
        });

        await eventService.update(eventId, { prizes: updatedPrizes });
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("PrizeAwardService.remove error:", error);
      return {
        success: false,
        error: "Unable to remove prize award. Please try again later.",
      };
    }
  }

  /**
   * Check if a prize can be awarded (has available slots)
   *
   * Validates:
   * - Event exists
   * - Prize exists in event
   * - Prize has not exceeded maxWinners capacity
   */
  async canAwardPrize(
    eventId: string,
    prizeId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      this.log("info", `Checking if prize can be awarded`, {
        eventId,
        prizeId,
      });

      // Get event to check prize capacity
      const { eventService } = await import("./eventService");
      const eventResult = await eventService.getById(eventId);

      if (!eventResult.success || !eventResult.data) {
        return {
          success: false,
          error: "Event not found.",
        };
      }

      const event = eventResult.data;
      const prize = event.prizes.find((p) => p.id === prizeId);

      if (!prize) {
        return {
          success: false,
          error: "Prize not found in event.",
        };
      }

      // Check if prize has available slots
      const hasAvailableSlots = prize.currentWinners < prize.maxWinners;

      return {
        success: true,
        data: hasAvailableSlots,
      };
    } catch (error) {
      console.error("PrizeAwardService.canAwardPrize error:", error);
      return {
        success: false,
        error: "Unable to validate prize capacity. Please try again later.",
      };
    }
  }
}

// Export singleton instance
export const prizeAwardService = new PrizeAwardService();
