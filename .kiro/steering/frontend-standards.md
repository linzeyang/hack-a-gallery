---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# HackaGallery Frontend Development Standards

## Project Overview

**Project**: HackaGallery - AI-powered hackathon project showcase platform  
**Framework**: Next.js 15.5.5 with React 19.1.0  
**Language**: TypeScript 5  
**Styling**: TailwindCSS 4  
**Deployment**: AWS Amplify

## Core Technology Stack

### Dependencies (Locked Versions)

- **Next.js**: 15.5.5 (with Turbopack enabled)
- **React**: 19.1.0
- **React DOM**: 19.1.0
- **TypeScript**: ^5
- **TailwindCSS**: ^4
- **ESLint**: ^9 with eslint-config-next

### Build Configuration

- Use `--turbopack` flag for dev and build (already configured in package.json)
- Target: ES2017
- Module Resolution: bundler
- Path alias: `@/*` maps to `./src/*`

## Architecture Principles

### 1. App Router (Next.js 15)

- Use App Router exclusively (not Pages Router)
- File-based routing in `src/app/`
- Server Components by default
- Client Components only when needed (use `'use client'` directive)

### 2. Component Structure

```
src/
├── app/                    # App Router pages and layouts
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── projects/          # Project pages
│   ├── events/            # Event pages
│   └── profile/           # User profile pages
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── features/         # Feature-specific components
│   └── layout/           # Layout components
├── lib/                  # Utilities and helpers
│   ├── api/             # API client functions
│   ├── utils/           # Helper functions
│   └── types/           # TypeScript types
└── hooks/               # Custom React hooks
```

### 3. Server vs Client Components

**Use Server Components for**:

- Data fetching (when using API/AWS storage)
- Backend resource access
- Sensitive information handling
- Large dependencies that should stay on server

**Use Client Components for**:

- Interactivity (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- React hooks (useState, useEffect, etc.)
- Event listeners

### 4. Storage Architecture & Migration Path

**Phase 1 (MVP - Current)**: localStorage

- Pages using data storage MUST be Client Components (`"use client"`)
- Data fetched client-side with `useEffect`
- No SSR for data-driven pages (localStorage only works in browser)
- Affected pages: `/events`, `/events/[id]`, `/projects`, `/projects/[id]`

**Phase 2 (Production - Future)**: AWS/API Storage

- Pages will become Server Components (remove `"use client"`)
- Data fetched server-side with `async/await`
- Full SSR benefits: better performance, SEO, static generation
- Only storage adapter changes - service layer remains unchanged

**Key Principle**: The Client Component approach for localStorage is **correct and temporary**. The architecture is designed for easy migration to AWS with minimal code changes.

**Migration Documentation**: See `frontend/docs/STORAGE_MIGRATION_GUIDE.md` for detailed migration steps.

**Storage Adapter Pattern**:

```typescript
// Service layer (never changes)
const { data } = await eventService.getAll();

// Storage adapter (swappable)
export function getStorageAdapter(): IStorageAdapter {
  if (process.env.NEXT_PUBLIC_USE_AWS === "true") {
    return new AwsStorageAdapter(); // Phase 2
  }
  return new LocalStorageAdapter(); // Phase 1
}
```

## Code Standards

### TypeScript

- **Strict mode enabled**: All code must pass strict TypeScript checks
- **No implicit any**: Always define types explicitly
- **Interface over type**: Prefer `interface` for object shapes
- **Type imports**: Use `import type` for type-only imports

```typescript
// Good
import type { Project } from "@/lib/types/project";
interface ProjectCardProps {
  project: Project;
  onSelect: (id: string) => void;
}

// Avoid
import { Project } from "@/lib/types/project";
type ProjectCardProps = {
  project: any;
  onSelect: Function;
};
```

### Component Patterns

**Server Component Example**:

```typescript
// app/projects/page.tsx
import { getProjects } from "@/lib/api/projects";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

**Client Component Example**:

```typescript
// components/features/ProjectCard.tsx
"use client";

import { useState } from "react";
import type { Project } from "@/lib/types/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div onClick={() => setIsExpanded(!isExpanded)}>
      {/* component content */}
    </div>
  );
}
```

### Styling with TailwindCSS 4

- Use Tailwind utility classes directly in JSX
- Create custom components for repeated patterns
- Use `@apply` sparingly in CSS files
- Follow mobile-first responsive design

```typescript
// Good
<div className="flex flex-col gap-4 p-6 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow">
  <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
  <p className="text-gray-600">{description}</p>
</div>;

// For repeated patterns, create a component
export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-lg bg-white shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
}
```

## API Integration

### Backend Communication

- API endpoints will be AWS Lambda functions via API Gateway
- Use `fetch` in Server Components for data fetching
- Use React Query or SWR for Client Component data fetching
- Store API base URL in environment variables

```typescript
// lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}
```

### AWS Integration

- Use AWS Amplify for authentication (future phase)
- S3 for file uploads (project assets, images)
- CloudFront URLs for media delivery

## Data Types

### Core Domain Models

```typescript
// lib/types/project.ts
export interface Project {
  id: string;
  title: string;
  description: string;
  repoUrl: string;
  demoUrl?: string;
  videoUrl?: string;
  tags: string[];
  techStack: string[];
  eventId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  aiAnalysis?: ProjectAnalysis;
}

export interface ProjectAnalysis {
  summary: string;
  keyFeatures: string[];
  qualityScore: number;
  categories: string[];
}

// lib/types/event.ts
export interface Event {
  id: string;
  name: string;
  platform: "devpost" | "hackathon.com" | "manual";
  startDate: string;
  endDate: string;
  organizerId: string;
  prizes: Prize[];
  verified: boolean;
}

// lib/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  githubUrl?: string;
  linkedinUrl?: string;
  role: "hacker" | "organizer" | "investor";
  projects: string[]; // project IDs
}
```

## Performance Best Practices

### 1. Image Optimization

- Use Next.js `<Image>` component for all images
- Specify width and height to prevent layout shift
- Use appropriate image formats (WebP with fallbacks)

```typescript
import Image from "next/image";

<Image
  src={project.thumbnailUrl}
  alt={project.title}
  width={400}
  height={300}
  className="rounded-lg"
  priority={false}
/>;
```

### 2. Code Splitting

- Dynamic imports for heavy components
- Lazy load components below the fold

```typescript
import dynamic from "next/dynamic";

const ProjectAnalysis = dynamic(
  () => import("@/components/features/ProjectAnalysis"),
  {
    loading: () => <p>Loading analysis...</p>,
  }
);
```

### 3. Caching

- Use Next.js built-in caching for fetch requests
- Implement revalidation strategies

```typescript
// Revalidate every hour
export const revalidate = 3600;

async function getProjects() {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    next: { revalidate: 3600 },
  });
  return res.json();
}
```

## Error Handling

### Error Boundaries

```typescript
// app/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}
```

### Loading States

```typescript
// app/projects/loading.tsx
export default function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg" />
      ))}
    </div>
  );
}
```

## Accessibility

- Use semantic HTML elements
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Maintain color contrast ratios (WCAG AA minimum)
- Test with screen readers

```typescript
<button
  onClick={handleSubmit}
  aria-label="Submit project"
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  Submit
</button>
```

## Environment Variables

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_S3_BUCKET=hackagallery-assets
```

## Testing Strategy (Future)

- Unit tests: Vitest
- Component tests: React Testing Library
- E2E tests: Playwright
- Run tests before commits

## Git Workflow

- Branch naming: `feature/project-card`, `fix/api-error`
- Commit messages: Conventional Commits format
- PR reviews required before merge
- Keep commits atomic and focused

## MVP Priorities (Phase 1)

Focus on these features for hackathon submission:

1. **Project Submission Page**: Form to add GitHub URL
2. **Project Display**: Card-based grid layout
3. **Project Detail Page**: Full project information
4. **Basic Search**: Filter by tags/tech stack
5. **Responsive Design**: Mobile-first approach

## Common Patterns

### Form Handling

```typescript
"use client";

import { useState } from "react";

export function ProjectForm() {
  const [formData, setFormData] = useState({
    title: "",
    repoUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // API call
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full px-4 py-2 border rounded"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Submit
      </button>
    </form>
  );
}
```

### Data Fetching Pattern

```typescript
// Server Component
async function getProjectById(id: string) {
  const project = await apiClient<Project>(`/projects/${id}`);
  return project;
}

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProjectById(params.id);

  return <ProjectDetail project={project} />;
}
```

## Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [TailwindCSS 4 Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Questions?

When in doubt:

1. Check Next.js 15 documentation for App Router patterns
2. Use Server Components by default
3. Keep components small and focused
4. Follow TypeScript strict mode
5. Prioritize user experience and accessibility
