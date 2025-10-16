import type { IProjectService, ServiceResponse } from "@/lib/types/service";
import type { Project } from "@/lib/types/project";
import { getStorageAdapter } from "@/lib/utils/storage";

/**
 * Project Service Implementation
 *
 * Provides CRUD operations for hackathon projects using the storage adapter pattern.
 * This service is agnostic to the storage implementation (localStorage, DynamoDB, etc.)
 * and can be easily migrated by changing only the storage adapter.
 *
 * DynamoDB Key Pattern:
 * - Individual project: "project:eventId:projectId" → PK: "EVENT#eventId", SK: "PROJECT#projectId"
 * - All projects for event: "project:eventId:" prefix for getAll() operation
 * - All projects (any event): requires querying all events first, then their projects
 *
 * All operations return ServiceResponse for consistent error handling.
 */
class ProjectService implements IProjectService {
  private storage = getStorageAdapter();

  /**
   * Get all non-hidden projects across all events
   *
   * Note: This is an expensive operation in DynamoDB as it requires:
   * 1. Querying all events to get their IDs
   * 2. Querying projects for each event
   *
   * Consider using getByEvent() when possible for better performance.
   */
  async getAll(): Promise<ServiceResponse<Project[]>> {
    try {
      // Import eventService to get all events
      const { eventService } = await import("./eventService");
      const eventsResult = await eventService.getAll();

      if (!eventsResult.success || !eventsResult.data) {
        return {
          success: false,
          error: "Unable to load projects. Please try again later.",
        };
      }

      // Query projects for each event
      const allProjects: Project[] = [];
      for (const event of eventsResult.data) {
        const eventProjects = await this.storage.getAll<Project>(
          `project:${event.id}:`
        );
        allProjects.push(...eventProjects);
      }

      const filteredProjects = allProjects.filter((p) => !p.isHidden);
      return {
        success: true,
        data: filteredProjects,
      };
    } catch (error) {
      console.error("ProjectService.getAll error:", error);
      return {
        success: false,
        error:
          "Unable to load projects. Please check your connection and try again.",
      };
    }
  }

  /**
   * Get project by ID
   *
   * Note: Requires eventId to construct the DynamoDB key.
   * If eventId is not known, use getAll() and filter by project ID.
   *
   * @param id - Project ID in format "projectId" or "eventId:projectId"
   */
  async getById(id: string): Promise<ServiceResponse<Project>> {
    try {
      // Check if ID includes eventId (format: "eventId:projectId")
      const parts = id.split(":");

      if (parts.length === 2) {
        // ID includes eventId, use it directly
        const [eventId, projectId] = parts;
        const project = await this.storage.get<Project>(
          `project:${eventId}:${projectId}`
        );

        if (!project) {
          return {
            success: false,
            error:
              "Project not found. It may have been removed or the link is incorrect.",
          };
        }

        return {
          success: true,
          data: project,
        };
      }

      // ID is just projectId, need to search across all events
      // This is less efficient but maintains backward compatibility
      const allProjectsResult = await this.getAll();

      if (!allProjectsResult.success || !allProjectsResult.data) {
        return {
          success: false,
          error: "Unable to load project. Please try again later.",
        };
      }

      const project = allProjectsResult.data.find((p) => p.id === id);

      if (!project) {
        return {
          success: false,
          error:
            "Project not found. It may have been removed or the link is incorrect.",
        };
      }

      return {
        success: true,
        data: project,
      };
    } catch (error) {
      console.error("ProjectService.getById error:", error);
      return {
        success: false,
        error: "Unable to load project details. Please try again later.",
      };
    }
  }

  /**
   * Get all projects for a specific event
   *
   * Uses DynamoDB Query with "project:eventId:" prefix
   * Maps to PK: "EVENT#eventId", SK begins_with "PROJECT#"
   * This is the most efficient way to query projects in DynamoDB.
   */
  async getByEvent(eventId: string): Promise<ServiceResponse<Project[]>> {
    try {
      const projects = await this.storage.getAll<Project>(
        `project:${eventId}:`
      );
      const eventProjects = projects.filter((p) => !p.isHidden);

      return {
        success: true,
        data: eventProjects,
      };
    } catch (error) {
      console.error("ProjectService.getByEvent error:", error);
      return {
        success: false,
        error: "Unable to load event projects. Please try again later.",
      };
    }
  }

  /**
   * Create a new project
   *
   * Uses DynamoDB PutCommand with key "project:eventId:projectId"
   * The adapter will:
   * - Map to PK: "EVENT#eventId", SK: "PROJECT#projectId"
   * - Add GSI1 keys: GSI1PK: "HACKER#hackerId", GSI1SK: "PROJECT#projectId"
   * - Add timestamps: createdAt, updatedAt
   *
   * Note: eventId must be provided in projectData
   */
  async create(
    projectData: Omit<Project, "id" | "createdAt" | "updatedAt">
  ): Promise<ServiceResponse<Project>> {
    try {
      if (!projectData.eventId) {
        return {
          success: false,
          error: "Event ID is required to create a project.",
        };
      }

      const newProject: Project = {
        ...projectData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.storage.set(
        `project:${newProject.eventId}:${newProject.id}`,
        newProject
      );

      return {
        success: true,
        data: newProject,
      };
    } catch (error) {
      console.error("ProjectService.create error:", error);
      return {
        success: false,
        error:
          "Unable to create project. Please check your information and try again.",
      };
    }
  }

  /**
   * Update an existing project
   *
   * Uses DynamoDB GetCommand followed by PutCommand
   * The adapter will automatically update the updatedAt timestamp
   *
   * @param id - Project ID in format "projectId" or "eventId:projectId"
   */
  async update(
    id: string,
    projectData: Partial<Project>
  ): Promise<ServiceResponse<Project>> {
    try {
      // First, get the existing project to know its eventId
      const existingProjectResult = await this.getById(id);

      if (!existingProjectResult.success || !existingProjectResult.data) {
        return {
          success: false,
          error: "Project not found. It may have been removed.",
        };
      }

      const existingProject = existingProjectResult.data;

      const updatedProject: Project = {
        ...existingProject,
        ...projectData,
        id: existingProject.id, // Ensure ID doesn't change
        eventId: existingProject.eventId, // Ensure eventId doesn't change
        updatedAt: new Date().toISOString(),
      };

      await this.storage.set(
        `project:${updatedProject.eventId}:${updatedProject.id}`,
        updatedProject
      );

      return {
        success: true,
        data: updatedProject,
      };
    } catch (error) {
      console.error("ProjectService.update error:", error);
      return {
        success: false,
        error: "Unable to update project. Please try again later.",
      };
    }
  }

  /**
   * Hide a project (soft delete)
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
      console.error("ProjectService.hide error:", error);
      return {
        success: false,
        error: "Unable to hide project. Please try again later.",
      };
    }
  }

  /**
   * Get all projects by hacker ID
   *
   * Uses getAll() and filters by hackerId
   * In the future, this could be optimized to use GSI1 with:
   * GSI1PK: "HACKER#hackerId", GSI1SK begins_with "PROJECT#"
   *
   * For now, we retrieve all projects and filter client-side for simplicity.
   */
  async getByHacker(hackerId: string): Promise<ServiceResponse<Project[]>> {
    try {
      const allProjectsResult = await this.getAll();

      if (!allProjectsResult.success || !allProjectsResult.data) {
        return {
          success: false,
          error: "Unable to load projects. Please try again later.",
        };
      }

      const hackerProjects = allProjectsResult.data.filter(
        (p) => p.hackerId === hackerId
      );

      return {
        success: true,
        data: hackerProjects,
      };
    } catch (error) {
      console.error("ProjectService.getByHacker error:", error);
      return {
        success: false,
        error: "Unable to load hacker projects. Please try again later.",
      };
    }
  }

  /**
   * Generate a unique ID for new projects
   * In production, this would be handled by the backend
   */
  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const projectService = new ProjectService();
