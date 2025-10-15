import type { IProjectService, ServiceResponse } from '@/lib/types/service';
import type { Project } from '@/lib/types/project';
import { getStorageAdapter, STORAGE_KEYS } from '@/lib/utils/storage';

/**
 * Project Service Implementation
 * 
 * Provides CRUD operations for hackathon projects using the storage adapter pattern.
 * This service is agnostic to the storage implementation (localStorage, API, AWS, etc.)
 * and can be easily migrated by changing only the storage adapter.
 * 
 * All operations return ServiceResponse for consistent error handling.
 */
class ProjectService implements IProjectService {
  private storage = getStorageAdapter();

  /**
   * Get all non-hidden projects
   */
  async getAll(): Promise<ServiceResponse<Project[]>> {
    try {
      const projects = await this.storage.get<Project[]>(STORAGE_KEYS.PROJECTS);
      const filteredProjects = (projects || []).filter((p) => !p.isHidden);
      return {
        success: true,
        data: filteredProjects,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
      };
    }
  }

  /**
   * Get project by ID
   */
  async getById(id: string): Promise<ServiceResponse<Project>> {
    try {
      const projects = await this.storage.get<Project[]>(STORAGE_KEYS.PROJECTS);
      const project = (projects || []).find((p) => p.id === id);

      if (!project) {
        return {
          success: false,
          error: 'Project not found',
        };
      }

      return {
        success: true,
        data: project,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project',
      };
    }
  }

  /**
   * Get all projects for a specific event
   */
  async getByEvent(eventId: string): Promise<ServiceResponse<Project[]>> {
    try {
      const projects = await this.storage.get<Project[]>(STORAGE_KEYS.PROJECTS);
      const eventProjects = (projects || []).filter(
        (p) => p.eventId === eventId && !p.isHidden
      );

      return {
        success: true,
        data: eventProjects,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch event projects',
      };
    }
  }

  /**
   * Create a new project
   */
  async create(
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceResponse<Project>> {
    try {
      const projects = await this.storage.get<Project[]>(STORAGE_KEYS.PROJECTS);
      const existingProjects = projects || [];

      const newProject: Project = {
        ...projectData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedProjects = [...existingProjects, newProject];
      await this.storage.set(STORAGE_KEYS.PROJECTS, updatedProjects);

      return {
        success: true,
        data: newProject,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      };
    }
  }

  /**
   * Update an existing project
   */
  async update(id: string, projectData: Partial<Project>): Promise<ServiceResponse<Project>> {
    try {
      const projects = await this.storage.get<Project[]>(STORAGE_KEYS.PROJECTS);
      const existingProjects = projects || [];

      const projectIndex = existingProjects.findIndex((p) => p.id === id);

      if (projectIndex === -1) {
        return {
          success: false,
          error: 'Project not found',
        };
      }

      const updatedProject: Project = {
        ...existingProjects[projectIndex],
        ...projectData,
        id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
      };

      existingProjects[projectIndex] = updatedProject;
      await this.storage.set(STORAGE_KEYS.PROJECTS, existingProjects);

      return {
        success: true,
        data: updatedProject,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update project',
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to hide project',
      };
    }
  }

  /**
   * Get all projects by hacker ID
   */
  async getByHacker(hackerId: string): Promise<ServiceResponse<Project[]>> {
    try {
      const projects = await this.storage.get<Project[]>(STORAGE_KEYS.PROJECTS);
      const hackerProjects = (projects || []).filter((p) => p.hackerId === hackerId);

      return {
        success: true,
        data: hackerProjects,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch hacker projects',
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
