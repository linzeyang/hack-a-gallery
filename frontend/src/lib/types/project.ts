export interface Project {
  id: string;
  eventId: string;
  name: string;
  description: string;
  githubUrl: string;
  demoUrl?: string;
  technologies: string[];
  teamMembers: TeamMember[];
  hackerId: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  name: string;
  role: string;
  githubUsername?: string;
  userId?: string; // Optional reference to User for tracking projects globally
}
