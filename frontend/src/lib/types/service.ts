import type { Event } from "./event";
import type { Project } from "./project";
import type { PrizeAward } from "./prize";

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface IEventService {
  getAll(): Promise<ServiceResponse<Event[]>>;
  getById(id: string): Promise<ServiceResponse<Event>>;
  create(
    event: Omit<Event, "id" | "createdAt" | "updatedAt">
  ): Promise<ServiceResponse<Event>>;
  update(id: string, event: Partial<Event>): Promise<ServiceResponse<Event>>;
  hide(id: string): Promise<ServiceResponse<void>>;
  getByOrganizer(organizerId: string): Promise<ServiceResponse<Event[]>>;
}

export interface IProjectService {
  getAll(): Promise<ServiceResponse<Project[]>>;
  getById(id: string): Promise<ServiceResponse<Project>>;
  getByEvent(eventId: string): Promise<ServiceResponse<Project[]>>;
  create(
    project: Omit<Project, "id" | "createdAt" | "updatedAt">
  ): Promise<ServiceResponse<Project>>;
  update(
    id: string,
    project: Partial<Project>
  ): Promise<ServiceResponse<Project>>;
  hide(id: string): Promise<ServiceResponse<void>>;
  getByHacker(hackerId: string): Promise<ServiceResponse<Project[]>>;
}

/**
 * Prize Award Service Interface
 *
 * Manages the association between projects and prizes they have won.
 * Handles prize capacity validation and duplicate prevention.
 */
export interface IPrizeAwardService {
  /**
   * Create a new prize award
   *
   * @param award - Prize award data without id and awardedAt (auto-generated)
   * @returns ServiceResponse with the created PrizeAward
   */
  create(
    award: Omit<PrizeAward, "id" | "awardedAt">
  ): Promise<ServiceResponse<PrizeAward>>;

  /**
   * Get all prize awards for a specific project
   *
   * @param projectId - The project ID
   * @returns ServiceResponse with array of PrizeAwards
   */
  getByProject(projectId: string): Promise<ServiceResponse<PrizeAward[]>>;

  /**
   * Get all prize awards for a specific prize
   *
   * @param eventId - The event ID containing the prize
   * @param prizeId - The prize ID
   * @returns ServiceResponse with array of PrizeAwards
   */
  getByPrize(
    eventId: string,
    prizeId: string
  ): Promise<ServiceResponse<PrizeAward[]>>;

  /**
   * Get all prize awards for a specific event
   *
   * @param eventId - The event ID
   * @returns ServiceResponse with array of PrizeAwards
   */
  getByEvent(eventId: string): Promise<ServiceResponse<PrizeAward[]>>;

  /**
   * Remove a prize award
   *
   * @param eventId - The event ID
   * @param prizeId - The prize ID
   * @param projectId - The project ID
   * @returns ServiceResponse indicating success or failure
   */
  remove(
    eventId: string,
    prizeId: string,
    projectId: string
  ): Promise<ServiceResponse<void>>;

  /**
   * Check if a prize can be awarded (has available slots)
   *
   * @param eventId - The event ID
   * @param prizeId - The prize ID
   * @returns ServiceResponse with boolean indicating if prize can be awarded
   */
  canAwardPrize(
    eventId: string,
    prizeId: string
  ): Promise<ServiceResponse<boolean>>;
}
