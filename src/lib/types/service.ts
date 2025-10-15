import type { Event } from './event';
import type { Project } from './project';

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
  create(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<Event>>;
  update(id: string, event: Partial<Event>): Promise<ServiceResponse<Event>>;
  hide(id: string): Promise<ServiceResponse<void>>;
  getByOrganizer(organizerId: string): Promise<ServiceResponse<Event[]>>;
}

export interface IProjectService {
  getAll(): Promise<ServiceResponse<Project[]>>;
  getById(id: string): Promise<ServiceResponse<Project>>;
  getByEvent(eventId: string): Promise<ServiceResponse<Project[]>>;
  create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<Project>>;
  update(id: string, project: Partial<Project>): Promise<ServiceResponse<Project>>;
  hide(id: string): Promise<ServiceResponse<void>>;
  getByHacker(hackerId: string): Promise<ServiceResponse<Project[]>>;
}
