# Design Document

## Overview

This design document outlines the implementation of search functionality and security improvements for HackaGallery's frontend. The design builds upon the existing well-architected DynamoDB integration patterns and focuses on adding client-side search capabilities and securing environment variable configuration.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Server        │    │   Client         │    │   Storage       │
│   Components    │    │   Components     │    │   Layer         │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • EventsPage    │───▶│ • SearchInterface│    │ • DynamoDB      │
│ • ProjectsPage  │    │ • ProjectsClient │    │ • EventService  │
│ • EventDetail   │    │ • FilterControls │    │ • ProjectService│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │   API Routes     │
                    ├──────────────────┤
                    │ • GET /api/*     │
                    │ • POST /api/*    │
                    │ • PATCH /api/*   │
                    └──────────────────┘
```

### Search Architecture

The search functionality will be implemented as client-side filtering to provide instant results without additional server requests:

```
Projects Data (from Server) → Search Interface → Filtered Results
                                     ↓
                              Filter Components:
                              • Text Search
                              • Technology Filter
                              • Event Filter
                              • Sort Options
```

## Components and Interfaces

### 1. Search Interface Components

#### SearchBar Component

```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  className,
}: SearchBarProps) {
  // Debounced input with search icon
  // Clear button when value exists
  // Responsive design for mobile
}
```

#### FilterControls Component

```typescript
interface FilterControlsProps {
  technologies: string[];
  events: Array<{ id: string; name: string; projectCount: number }>;
  selectedTechnologies: string[];
  selectedEvents: string[];
  sortBy: "date" | "title" | "popularity";
  onTechnologyChange: (technologies: string[]) => void;
  onEventChange: (events: string[]) => void;
  onSortChange: (sort: "date" | "title" | "popularity") => void;
  onClearAll: () => void;
}

export function FilterControls(props: FilterControlsProps) {
  // Multi-select dropdowns for technologies and events
  // Sort dropdown with options
  // Active filter indicators with remove buttons
  // Clear all filters button
}
```

#### SearchResults Component

```typescript
interface SearchResultsProps {
  projects: Project[];
  searchTerm: string;
  activeFilters: {
    technologies: string[];
    events: string[];
    sortBy: string;
  };
  totalCount: number;
}

export function SearchResults({
  projects,
  searchTerm,
  activeFilters,
  totalCount,
}: SearchResultsProps) {
  // Results count display
  // Active filters summary
  // Highlighted search terms in project cards
  // Empty state when no results
}
```

### 2. Enhanced ProjectsClient

The existing `ProjectsClient` will be enhanced with search capabilities:

```typescript
interface ProjectsClientProps {
  projects: Project[];
  events: Event[]; // Added for event filtering
}

export function ProjectsClient({ projects, events }: ProjectsClientProps) {
  // Search state management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(
    []
  );
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "title" | "popularity">("date");

  // Derived data
  const availableTechnologies = useMemo(
    () => extractUniqueTechnologies(projects),
    [projects]
  );
  const eventsWithCounts = useMemo(
    () => calculateEventCounts(events, projects),
    [events, projects]
  );

  // Filtering logic
  const filteredProjects = useMemo(() => {
    return filterAndSortProjects(projects, {
      searchTerm,
      selectedTechnologies,
      selectedEvents,
      sortBy,
    });
  }, [projects, searchTerm, selectedTechnologies, selectedEvents, sortBy]);

  // Component renders SearchBar, FilterControls, and SearchResults
}
```

### 3. Filtering Logic

#### Core Filtering Functions

```typescript
interface FilterCriteria {
  searchTerm: string;
  selectedTechnologies: string[];
  selectedEvents: string[];
  sortBy: "date" | "title" | "popularity";
}

export function filterAndSortProjects(
  projects: Project[],
  criteria: FilterCriteria
): Project[] {
  let filtered = projects;

  // Text search across title, description, and tags
  if (criteria.searchTerm) {
    const searchLower = criteria.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (project) =>
        project.title.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  }

  // Technology filtering
  if (criteria.selectedTechnologies.length > 0) {
    filtered = filtered.filter((project) =>
      criteria.selectedTechnologies.some((tech) =>
        project.techStack.includes(tech)
      )
    );
  }

  // Event filtering
  if (criteria.selectedEvents.length > 0) {
    filtered = filtered.filter((project) =>
      criteria.selectedEvents.includes(project.eventId)
    );
  }

  // Sorting
  return sortProjects(filtered, criteria.sortBy);
}

export function sortProjects(projects: Project[], sortBy: string): Project[] {
  switch (sortBy) {
    case "date":
      return [...projects].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "title":
      return [...projects].sort((a, b) => a.title.localeCompare(b.title));
    case "popularity":
      // Could be based on views, likes, or other metrics
      return [...projects].sort((a, b) => (b.views || 0) - (a.views || 0));
    default:
      return projects;
  }
}
```

### 4. Utility Functions

#### Text Highlighting

```typescript
export function highlightSearchTerm(
  text: string,
  searchTerm: string
): React.ReactNode {
  if (!searchTerm) return text;

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
```

#### Data Extraction

```typescript
export function extractUniqueTechnologies(projects: Project[]): string[] {
  const techSet = new Set<string>();
  projects.forEach((project) => {
    project.techStack.forEach((tech) => techSet.add(tech));
  });
  return Array.from(techSet).sort();
}

export function calculateEventCounts(
  events: Event[],
  projects: Project[]
): Array<{ id: string; name: string; projectCount: number }> {
  return events
    .map((event) => ({
      id: event.id,
      name: event.name,
      projectCount: projects.filter((p) => p.eventId === event.id).length,
    }))
    .filter((event) => event.projectCount > 0);
}
```

## Data Models

### Enhanced Project Interface

The existing Project interface may need minor enhancements:

```typescript
interface Project {
  // Existing fields...
  id: string;
  title: string;
  description: string;
  techStack: string[];
  tags: string[];
  eventId: string;
  createdAt: string;

  // Optional enhancements for search
  views?: number; // For popularity sorting
  featured?: boolean; // For highlighting special projects
}
```

### Search State Interface

```typescript
interface SearchState {
  searchTerm: string;
  selectedTechnologies: string[];
  selectedEvents: string[];
  sortBy: "date" | "title" | "popularity";
}

interface SearchFilters {
  technologies: string[];
  events: Array<{ id: string; name: string; projectCount: number }>;
}
```

## Error Handling

### Search Error Scenarios

1. **Empty Results**: Display helpful messaging with suggestions
2. **Invalid Filter State**: Reset to default state with user notification
3. **Performance Issues**: Implement loading states for large datasets

### Error Recovery

```typescript
export function SearchErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Search temporarily unavailable</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Testing Strategy

### Unit Tests

- Filter functions with various input combinations
- Search term highlighting logic
- Data extraction utilities
- Sort functions

### Integration Tests

- Complete search workflow
- Filter state management
- URL parameter synchronization (future enhancement)

### Performance Tests

- Large dataset filtering (1000+ projects)
- Debounced search input
- Memory usage with complex filters

## Security Improvements

### Critical Security Findings from AWS Documentation

Based on AWS official documentation research, our current approach has **critical security vulnerabilities** that must be addressed:

#### ❌ Current Security Issues

1. **Direct DynamoDB Access from Browser**: Our current design allows DynamoDB client initialization in the browser, which AWS explicitly warns against
2. **Hardcoded Credentials Risk**: Environment variables with AWS credentials are accessible in the browser
3. **No Proper Authentication**: Missing Amazon Cognito integration for secure browser-based AWS access

#### ✅ AWS Recommended Security Architecture

According to AWS documentation, the **recommended approach** for browser-based DynamoDB access is:

```
Browser → Amazon Cognito Identity Pool → Temporary Credentials → DynamoDB
```

**NOT**: `Browser → Direct AWS Credentials → DynamoDB` (current approach)

### Secure Implementation Strategy

#### Option 1: Server-Only DynamoDB Access (Recommended for MVP)

```typescript
// SECURE - All DynamoDB operations server-side only
export function getAWSConfig(): AWSConfig {
  // This function should ONLY run on server-side
  if (typeof window !== 'undefined') {
    throw new Error('AWS configuration must not be accessed from browser');
  }

  const region =
    process.env.HACKAGALLERY_AWS_REGION ||
    process.env.AWS_REGION ||
    "us-west-2";

  // Remove ALL NEXT_PUBLIC_ options - server-side only
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  const endpoint = process.env.DYNAMODB_ENDPOINT;

  if (!tableName) {
    throw new Error(
      "DYNAMODB_TABLE_NAME environment variable is required. " +
      "This must be set as a server-side environment variable."
    );
  }

  const config: AWSConfig = { region, tableName };
  if (endpoint) {
    config.endpoint = endpoint;
  }
  return config;
}
```

#### Option 2: Amazon Cognito Integration (Future Enhancement)

For true client-side DynamoDB access, AWS recommends Amazon Cognito:

```typescript
// Future implementation with Cognito
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

export function getSecureDynamoDBClient() {
  return new DynamoDBClient({
    region: "us-west-2",
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: "us-west-2" }),
      identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
    }),
  });
}
```

### Updated Environment Variable Security

#### Secure Configuration

```bash
# .env.local - SECURE CONFIGURATION

# Server-side ONLY (no NEXT_PUBLIC_ prefix)
DYNAMODB_TABLE_NAME=hackagallery-dev
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
DYNAMODB_ENDPOINT=http://localhost:8000  # Local development only

# Client-side (NEXT_PUBLIC_ prefix) - Non-sensitive only
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development
# NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-west-2:xxx  # Future Cognito integration
```

#### Security Validation

```typescript
// Add runtime security checks
export function validateSecurityConfiguration() {
  // Check for accidentally exposed sensitive variables
  const exposedVars = Object.keys(process.env).filter(key => 
    key.startsWith('NEXT_PUBLIC_') && 
    (key.includes('AWS_') || key.includes('DYNAMODB_') || key.includes('SECRET'))
  );
  
  if (exposedVars.length > 0) {
    throw new Error(
      `Security violation: Sensitive variables exposed to browser: ${exposedVars.join(', ')}`
    );
  }
}
```

### Architecture Impact

This security refinement means:

1. **All DynamoDB operations MUST remain server-side** (current implementation is correct)
2. **Client Components MUST use API routes** for all data operations (current implementation is correct)
3. **No direct DynamoDB client in browser** (our current design already follows this)
4. **Search functionality remains client-side** (filtering already-fetched data is secure)

### Security Compliance Checklist

- [ ] Remove `NEXT_PUBLIC_DYNAMODB_TABLE_NAME` option from AWS config
- [ ] Remove `NEXT_PUBLIC_DYNAMODB_ENDPOINT` option from AWS config  
- [ ] Add browser detection in `getAWSConfig()` to prevent client-side access
- [ ] Add security validation checks for exposed environment variables
- [ ] Document Cognito integration path for future client-side needs
- [ ] Verify all DynamoDB operations remain server-side only

## API Route Enhancements

### Missing GET Endpoints

#### Events API

```typescript
// app/api/events/route.ts - Add GET method
export async function GET() {
  try {
    const result = await eventService.getAll();

    if (result.success) {
      return NextResponse.json(result.data);
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

#### Projects API

```typescript
// app/api/projects/route.ts - Add GET method
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const result = eventId
      ? await projectService.getByEvent(eventId)
      : await projectService.getAll();

    if (result.success) {
      return NextResponse.json(result.data);
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

## Performance Considerations

### Client-Side Filtering Performance

- **Debounced Search**: 300ms delay to avoid excessive filtering
- **Memoized Results**: Use React.useMemo for expensive calculations
- **Virtual Scrolling**: Consider for large result sets (future enhancement)

### Memory Management

- **Filter State**: Keep filter state minimal and serializable
- **Component Cleanup**: Proper cleanup of event listeners and timers

### Mobile Optimization

- **Touch Targets**: Minimum 44px touch targets for filter controls
- **Responsive Design**: Collapsible filter panels on mobile
- **Performance**: Optimize for slower mobile devices

## Implementation Priority

### Phase 1: Core Search (High Priority)

1. SearchBar component with debounced input
2. Basic text filtering across title/description/tags
3. Results display with count

### Phase 2: Advanced Filtering (Medium Priority)

1. Technology filter dropdown
2. Event filter dropdown
3. Sort options
4. Active filter indicators

### Phase 3: Enhanced UX (Low Priority)

1. Search term highlighting
2. Filter state persistence
3. Advanced sorting options
4. Search analytics

### Phase 4: Security Fixes (High Priority)

1. Remove NEXT*PUBLIC* prefixes from AWS config
2. Update environment variable documentation
3. Add missing GET API routes
