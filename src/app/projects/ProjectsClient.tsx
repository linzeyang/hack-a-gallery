'use client';

import { useRouter } from 'next/navigation';
import { ProjectCard } from '@/components/features/ProjectCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Project } from '@/lib/types/project';

interface ProjectsClientProps {
  projects: Project[];
}

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            All Projects
          </h1>
          <p className="text-gray-600">
            Explore amazing hackathon projects from our community
          </p>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="No Projects Yet"
            description="Be the first to submit a project!"
            actionLabel="Browse Events"
            onAction={() => router.push('/events')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project}
                onClick={() => router.push(`/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
