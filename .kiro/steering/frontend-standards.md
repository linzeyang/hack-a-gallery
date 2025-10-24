---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# HackaGallery Frontend Development Standards

## Project Overview

**Project**: HackaGallery - AI-powered hackathon project showcase platform  
**Framework**: Next.js 16.0.0 with React 19.2.0  
**Language**: TypeScript 5  
**Styling**: TailwindCSS 4  
**Deployment**: AWS Amplify

## Core Technology Stack

### Dependencies (Current Versions)

- **Next.js**: 16.0.0
- **React**: 19.2.0
- **React DOM**: 19.2.0
- **TypeScript**: ^5
- **TailwindCSS**: ^4
- **ESLint**: ^9 with eslint-config-next
- **AWS SDK**: ^3.709.0 (DynamoDB client)
- **Vitest**: ^4 (testing framework)

### Build Configuration

- Turbopack is now the default bundler in Next.js 16 (no flag needed)
- Target: ES2017
- Module Resolution: bundler
- Path alias: `@/*` maps to `./src/*`

## Architecture Principles

### 1. App Router (Next.js 16)

- Use App Router exclusively (not Pages Router)
- File-based routing in `src/app/`
- Server Components by default
- Client Components only when needed (use `'use client'` directive)
- **CRITICAL**: All dynamic route params and searchParams are now async (must be awaited)

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

### 4. Storage Architecture (DynamoDB)

**Current State**: DynamoDB with AWS SDK

- **Server Components**: Fetch data directly using services (e.g., `eventService.getAll()`)
- **Client Components**: Never call services directly - use API routes instead
- **Write Operations**: Always use API routes (`/api/events`, `/api/projects`)
- **Environment Variables**: Server-side only (no `NEXT_PUBLIC_` prefix for secrets)

**Critical Pattern**:

```typescript
// ✅ CORRECT: Server Component fetches data
export default async function EventsPage() {
  const { data: events } = await eventService.getAll();
  return <EventsClient events={events || []} />;
}

// ❌ WRONG: Client Component with useEffect
("use client");
export default function EventsPage() {
  useEffect(() => {
    // This fails! DynamoDB needs server-side env vars
    eventService.getAll().then(setEvents);
  }, []);
}
```

**DynamoDB Key Patterns**:

- Events: `event:eventId` → PK: `EVENT#eventId`, SK: `METADATA`
- Projects: `project:eventId:projectId` → PK: `EVENT#eventId`, SK: `PROJECT#projectId`
- Use hierarchical keys for efficient queries and relationships

**See Also**: `.kiro/steering/dynamodb-backend-patterns.md` for complete DynamoDB integration patterns

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

**Server Component Example (Next.js 16)**:

```typescript
// app/projects/page.tsx
import { projectService } from "@/services/projectService";

export default async function ProjectsPage() {
  // Direct service call in Server Component
  const { data: projects } = await projectService.getAll();

  return (
    <div>
      {(projects || []).map((project) => (
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

**Current Architecture**: Next.js API Routes + DynamoDB

- **Read Operations**: Server Components call services directly
- **Write Operations**: Client Components call API routes
- **API Routes**: Located in `app/api/` directory
- **Services**: Located in `src/services/` directory

```typescript
// app/api/events/route.ts - API Route for mutations
import { eventService } from "@/services/eventService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await eventService.create(body);

    if (result.success) {
      return NextResponse.json(result.data, { status: 201 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

```typescript
// Client Component calls API route
"use client";

async function handleSubmit(data: EventFormData) {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    const event = await response.json();
    router.push(`/events/${event.id}`);
  }
}
```

### AWS Integration

- **DynamoDB**: Primary database (AWS SDK v3)
- **Authentication**: AWS Amplify (future phase)
- **File Storage**: S3 for uploads (future phase)
- **CDN**: CloudFront for media delivery (future phase)

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
# Server-side only (no NEXT_PUBLIC_ prefix)
DYNAMODB_TABLE_NAME=hackagallery-dev
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Client-side (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_USE_LOCALSTORAGE=false
```

**Critical Rules**:

- **Server-side vars**: No `NEXT_PUBLIC_` prefix (secrets, DB credentials)
- **Client-side vars**: Must have `NEXT_PUBLIC_` prefix (public config)
- **Never expose secrets**: Don't prefix sensitive data with `NEXT_PUBLIC_`
- **Access patterns**:
  - Server Components: Can access all env vars
  - API Routes: Can access all env vars
  - Client Components: Can only access `NEXT_PUBLIC_*` vars

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

### Data Fetching Pattern (Next.js 16)

```typescript
// Server Component with async params
import { projectService } from "@/services/projectService";

interface ProjectPageProps {
  params: Promise<{ id: string }>; // ⚠️ Promise in Next.js 16!
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  // ⚠️ Must await params in Next.js 16
  const { id } = await params;

  // Direct service call
  const { data: project } = await projectService.getById(id);

  if (!project) {
    return <div>Project not found</div>;
  }

  return <ProjectDetail project={project} />;
}
```

**Next.js 16 Breaking Change**: All dynamic route params and searchParams are now Promises and must be awaited:

```typescript
// ✅ CORRECT (Next.js 16)
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ query?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { query } = await searchParams;
}

// ❌ WRONG (Next.js 15 style - will cause warnings)
interface PageProps {
  params: { id: string };
  searchParams: { query?: string };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = params; // Not awaited!
}
```

## Next.js 16 Specific Features

### Async Request APIs

All request-related APIs are now async in Next.js 16:

```typescript
// params - Dynamic route parameters
const { id } = await params;

// searchParams - URL query parameters
const { query } = await searchParams;

// cookies - Request cookies (in Server Components/API routes)
import { cookies } from "next/headers";
const cookieStore = await cookies();
const token = cookieStore.get("token");

// headers - Request headers (in Server Components/API routes)
import { headers } from "next/headers";
const headersList = await headers();
const userAgent = headersList.get("user-agent");
```

### Turbopack (Default)

- Turbopack is now the default bundler (no configuration needed)
- Faster builds and hot module replacement
- Better error messages and debugging

### Proxy (formerly Middleware)

- `middleware.ts` is being renamed to `proxy.ts`
- `middleware` export is being renamed to `proxy`
- Old names still work but are deprecated

## Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [TailwindCSS 4 Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [AWS SDK v3 Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

## Questions?

When in doubt:

1. Check Next.js 16 documentation for App Router patterns
2. Use Server Components by default
3. Always await params and searchParams
4. Never call services from Client Components - use API routes
5. Keep secrets server-side only (no NEXT*PUBLIC* prefix)
6. Follow TypeScript strict mode
7. Prioritize user experience and accessibility

## Related Documentation

- **DynamoDB Patterns**: See `.kiro/steering/dynamodb-backend-patterns.md`
- **Migration Guide**: See `frontend/docs/STORAGE_MIGRATION_GUIDE.md` (if exists)
