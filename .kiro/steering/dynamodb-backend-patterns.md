---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# DynamoDB and Backend Integration Patterns

## Critical Learnings from DynamoDB Migration

This document captures critical patterns and anti-patterns learned during the localStorage to DynamoDB migration. **Follow these patterns to avoid common pitfalls.**

---

## 1. Server vs Client Component Data Fetching

### ✅ CORRECT Pattern: Server Components for Data Fetching

```typescript
// app/events/page.tsx - Server Component
import { eventService } from "@/services/eventService";

export default async function EventsPage() {
  // Data fetching happens on SERVER
  const { data: events } = await eventService.getAll();

  return <EventsClient events={events || []} />;
}
```

### ❌ WRONG Pattern: Client Component with useEffect

```typescript
// DON'T DO THIS - Causes environment variable errors
"use client";

export default function EventsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // This tries to initialize DynamoDB in browser!
    // Server-side env vars (DYNAMODB_TABLE_NAME) not available
    eventService.getAll().then((result) => setEvents(result.data));
  }, []);
}
```

**Why This Fails**:

- Client Components run in the browser
- DynamoDB adapter needs server-side environment variables
- `DYNAMODB_TABLE_NAME` (without `NEXT_PUBLIC_` prefix) is not available in browser
- Results in: "DYNAMODB_TABLE_NAME environment variable is required" error

**Rule**: Always fetch data in Server Components, pass as props to Client Components.

---

## 2. Write Operations: Use API Routes

### ✅ CORRECT Pattern: API Routes for Mutations

```typescript
// app/api/events/route.ts - Server-side API route
import { eventService } from "@/services/eventService";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await eventService.create(body);

  if (result.success) {
    return NextResponse.json(result.data, { status: 201 });
  }
  return NextResponse.json({ error: result.error }, { status: 400 });
}
```

```typescript
// Client component calls API route
"use client";

async function handleSubmit(data) {
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

### ❌ WRONG Pattern: Direct Service Calls from Client

```typescript
// DON'T DO THIS
"use client";

async function handleSubmit(data) {
  // This tries to initialize DynamoDB in browser!
  const result = await eventService.create(data);
}
```

**Rule**: Never call services directly from Client Components. Always use API routes.

---

## 3. Next.js 15 Async Params

### ✅ CORRECT Pattern: Await Dynamic Route Params

```typescript
// app/events/[id]/page.tsx
interface EventDetailPageProps {
  params: Promise<{ id: string }>; // Promise!
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params; // Await!

  const { data: event } = await eventService.getById(id);
  return <EventDetail event={event} />;
}
```

### ❌ WRONG Pattern: Synchronous Params Access

```typescript
// DON'T DO THIS - Causes Next.js 15 warnings
interface EventDetailPageProps {
  params: { id: string }; // Not a Promise
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = params; // Not awaited - causes warning
}
```

**Rule**: In Next.js 15, always declare `params` as `Promise<T>` and await it.

---

## 4. DynamoDB Key Patterns

### ✅ CORRECT Pattern: Hierarchical Keys

```typescript
// Events: "event:eventId"
// Maps to: PK: "EVENT#eventId", SK: "METADATA"
await storage.get<Event>("event:evt_123");
await storage.getAll<Event>("event:"); // All events

// Projects: "project:eventId:projectId"
// Maps to: PK: "EVENT#eventId", SK: "PROJECT#projectId"
await storage.get<Project>("project:evt_123:proj_456");
await storage.getAll<Project>("project:evt_123:"); // Projects for event
```

### ❌ WRONG Pattern: Flat Keys (localStorage style)

```typescript
// DON'T DO THIS - Old localStorage pattern
await storage.get<Event[]>("hackagallery_events"); // Returns array
await storage.get<Project[]>("hackagallery_projects"); // Returns array
```

**Why This Changed**:

- localStorage stored entire arrays under single keys
- DynamoDB stores individual items with hierarchical keys
- Enables efficient queries and relationships

**Rule**: Use hierarchical key patterns that match DynamoDB single-table design.

---

## 5. Service Layer Patterns

### ✅ CORRECT Pattern: Individual Item Operations

```typescript
// eventService.ts
async getAll(): Promise<ServiceResponse<Event[]>> {
  // Query all events individually
  const events = await this.storage.getAll<Event>('event:');
  return { success: true, data: events };
}

async getById(id: string): Promise<ServiceResponse<Event>> {
  // Get single event
  const event = await this.storage.get<Event>(`event:${id}`);
  return { success: true, data: event };
}

async create(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) {
  const newEvent = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
  // Store individual event
  await this.storage.set(`event:${newEvent.id}`, newEvent);
  return { success: true, data: newEvent };
}
```

### ❌ WRONG Pattern: Array-Based Operations

```typescript
// DON'T DO THIS - Old localStorage pattern
async getAll(): Promise<ServiceResponse<Event[]>> {
  const events = await this.storage.get<Event[]>('hackagallery_events');
  return { success: true, data: events || [] };
}

async create(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) {
  const events = await this.storage.get<Event[]>('hackagallery_events') || [];
  const newEvent = { ...data, id: generateId() };
  events.push(newEvent);
  await this.storage.set('hackagallery_events', events); // Store entire array
}
```

**Rule**: Services should work with individual items, not arrays.

---

## 6. Form Pages Architecture

### ✅ CORRECT Pattern: Server Component + Client Component + API Route

```typescript
// page.tsx - Server Component (fetches initial data)
export default async function EventCreatePage({ searchParams }: Props) {
  const params = await searchParams;
  const eventId = params.id;

  let event = undefined;
  if (eventId) {
    const { data } = await eventService.getById(eventId);
    event = data;
  }

  return <EventCreateClient initialEvent={event} eventId={eventId} />;
}

// EventCreateClient.tsx - Client Component (handles form)
("use client");

export function EventCreateClient({ initialEvent, eventId }: Props) {
  async function handleSubmit(data) {
    const url = eventId ? `/api/events/${eventId}` : "/api/events";
    const method = eventId ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const event = await response.json();
      router.push(`/events/${event.id}`);
    }
  }

  return <EventForm initialData={initialEvent} onSubmit={handleSubmit} />;
}

// api/events/route.ts - API Route (handles mutation)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await eventService.create(body);
  return NextResponse.json(result.data, { status: 201 });
}
```

### ❌ WRONG Pattern: Client Component Only

```typescript
// DON'T DO THIS
"use client";

export default function EventCreatePage() {
  const [event, setEvent] = useState();

  useEffect(() => {
    // Tries to fetch in browser - DynamoDB error!
    if (eventId) {
      eventService.getById(eventId).then((result) => setEvent(result.data));
    }
  }, [eventId]);

  async function handleSubmit(data) {
    // Tries to mutate in browser - DynamoDB error!
    await eventService.create(data);
  }
}
```

**Rule**: Form pages need three layers:

1. Server Component for initial data fetching
2. Client Component for form interactivity
3. API Route for mutations

---

## 7. Environment Variables

### ✅ CORRECT Pattern: Server-Side Only for Secrets

```bash
# .env.local
# Server-side only (no NEXT_PUBLIC_ prefix)
DYNAMODB_TABLE_NAME=hackagallery-dev
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Client-side (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_USE_LOCALSTORAGE=false
```

**Access Patterns**:

- Server Components: Can access all env vars
- API Routes: Can access all env vars
- Client Components: Can only access `NEXT_PUBLIC_*` vars

### ❌ WRONG Pattern: Exposing Secrets to Browser

```bash
# DON'T DO THIS
NEXT_PUBLIC_DYNAMODB_TABLE_NAME=hackagallery-dev  # Exposed to browser!
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=AKIA...  # Security risk!
```

**Rule**: Never prefix sensitive credentials with `NEXT_PUBLIC_`.

---

## 8. Performance Considerations

### ⚠️ Expensive Operations

```typescript
// projectService.getAll() is expensive!
async getAll(): Promise<ServiceResponse<Project[]>> {
  // 1. Query all events
  const eventsResult = await eventService.getAll();

  // 2. Query projects for EACH event
  const allProjects: Project[] = [];
  for (const event of eventsResult.data) {
    const eventProjects = await this.storage.getAll<Project>(`project:${event.id}:`);
    allProjects.push(...eventProjects);
  }

  return { success: true, data: allProjects };
}
```

**Complexity**: O(n \* m) where n = events, m = avg projects per event

**Solutions**:

1. **Add GSI**: Create GSI3 with `GSI3PK: "PROJECT"` to query all projects directly
2. **Pagination**: Limit to recent events only
3. **Caching**: Use Next.js revalidation or Redis
4. **Alternative**: Remove "All Projects" page, only show projects within events

**Rule**: Avoid nested queries. Use GSI or pagination for production.

---

## 9. Testing Patterns

### ✅ CORRECT Pattern: End-to-End Testing

```typescript
// Use Playwright for E2E testing
await page.goto("http://localhost:3000/events");
await page.getByRole("button", { name: "Create Event" }).click();
await page.getByRole("textbox", { name: "Event Name" }).fill("Test Event");
await page.getByRole("button", { name: "Create Event" }).click();

// Verify DynamoDB operations in console logs
// {"level":"info","message":"Retrieved 3 items with prefix: event:"}
```

**What to Test**:

1. Complete user flows (create event → submit project)
2. Data persistence across page navigations
3. DynamoDB query logs in console
4. Error handling and edge cases

**Rule**: Test complete flows, not just individual components.

---

## 10. Migration Checklist

When migrating a page to DynamoDB:

- [ ] Convert page to Server Component
- [ ] Move data fetching to server (remove `useEffect`)
- [ ] Create Client Component for interactivity
- [ ] Create API routes for write operations
- [ ] Update service calls to use new key patterns
- [ ] Add loading states
- [ ] Update params to async (Next.js 15)
- [ ] Test with Playwright
- [ ] Verify no environment variable errors in browser console
- [ ] Check DynamoDB query logs

---

## Common Error Messages and Solutions

### Error: "DYNAMODB_TABLE_NAME environment variable is required"

**Cause**: Client Component trying to initialize DynamoDB adapter in browser

**Solution**:

1. Convert page to Server Component for data fetching
2. Use API routes for write operations
3. Never call services directly from Client Components

### Error: "Route used `params.id`. `params` should be awaited"

**Cause**: Using synchronous params in Next.js 15

**Solution**:

```typescript
// Change this:
const { id } = params;

// To this:
const { id } = await params;
```

### Error: "Failed to get item with key: hackagallery_events"

**Cause**: Service still using old localStorage key patterns

**Solution**: Update service to use DynamoDB key patterns:

```typescript
// Change this:
await storage.get("hackagallery_events");

// To this:
await storage.getAll("event:");
```

---

## Quick Reference

| Operation     | Server Component         | Client Component     | API Route       |
| ------------- | ------------------------ | -------------------- | --------------- |
| Read data     | ✅ Use services directly | ❌ Never             | ✅ Use services |
| Write data    | ✅ Use services directly | ❌ Never             | ✅ Use services |
| Form handling | ❌ No forms              | ✅ Use fetch()       | N/A             |
| Navigation    | ✅ Can use               | ✅ Use useRouter     | N/A             |
| Env vars      | ✅ All vars              | ⚠️ Only NEXT*PUBLIC* | ✅ All vars     |

---

## Summary

**Golden Rules**:

1. Server Components for data fetching
2. API routes for write operations
3. Client Components only for interactivity
4. Never call services from browser
5. Use hierarchical DynamoDB key patterns
6. Await params in Next.js 15
7. Keep secrets server-side only
8. Test end-to-end with Playwright

Following these patterns will prevent the most common issues encountered during DynamoDB integration.
