# Design Document

## Overview

The Project Prize Tracking feature enables hackathon projects to be associated with prizes they've won, providing enhanced discovery and recognition capabilities. The design extends the existing Project and Prize data models while maintaining backward compatibility and integrating seamlessly with the current search and filtering system.

## Architecture

### Data Model Extensions

#### Enhanced Prize Interface

```typescript
export interface Prize {
  id: string; // New: Unique identifier for prize
  title: string; // Existing
  amount: string; // Existing
  description: string; // Existing
  maxWinners: number; // New: Number of projects that can win (default: 1)
  currentWinners: number; // New: Current number of awarded projects
}
```

#### New PrizeAward Interface

```typescript
export interface PrizeAward {
  id: string; // Unique award identifier
  projectId: string; // Reference to winning project
  prizeId: string; // Reference to prize won
  eventId: string; // Reference to event (for data consistency)
  awardedAt: string; // ISO timestamp when prize was awarded
  awardedBy?: string; // Optional: ID of user who awarded the prize
}
```

#### Enhanced Project Interface

```typescript
export interface Project {
  // ... existing fields
  prizeAwards: PrizeAward[]; // New: Array of prizes won by this project
  hasPrizes: boolean; // New: Computed field for quick filtering
}
```

### DynamoDB Storage Pattern

Following AWS best practices for single-table design and the adjacency list pattern for many-to-many relationships.

#### Prize Awards Storage (Adjacency List Pattern)

**Storage Key Pattern**: `prize-award:eventId:prizeId:projectId`

**DynamoDB Keys**:

- **PK**: `EVENT#eventId`
- **SK**: `PRIZE-AWARD#prizeId#projectId`
- **GSI1PK**: `PROJECT#projectId` (sparse index)
- **GSI1SK**: `PRIZE-AWARD#prizeId`

**Design Rationale**:

- **Single-table design**: Consistent with existing Event/Project pattern, reduces operational complexity
- **Adjacency list pattern**: Models many-to-many relationship between prizes and projects efficiently
- **Sparse GSI**: Only prize award items have GSI1 keys, keeping the index small and cost-effective
- **High cardinality PK**: Distributes load evenly across partitions (one partition per event)
- **Composite SK**: Enables efficient querying of all awards for a prize or all awards in an event

#### Supported Query Patterns:

1. **All prize awards for an event**:

   - Query: `PK = EVENT#eventId AND begins_with(SK, "PRIZE-AWARD#")`
   - Use case: Display all prize winners on event page
   - Complexity: O(n) where n = number of awards in event

2. **All prizes won by a specific project**:

   - Query GSI1: `GSI1PK = PROJECT#projectId`
   - Use case: Show prizes on project detail page
   - Complexity: O(m) where m = number of prizes won by project

3. **All projects that won a specific prize**:

   - Query: `PK = EVENT#eventId AND begins_with(SK, "PRIZE-AWARD#prizeId#")`
   - Use case: List winners of a specific prize
   - Complexity: O(k) where k = number of winners for that prize

4. **Check if specific project won specific prize**:
   - GetItem: `PK = EVENT#eventId, SK = PRIZE-AWARD#prizeId#projectId`
   - Use case: Validation before awarding prize
   - Complexity: O(1)

#### Enhanced Prize Storage

Prizes remain embedded in Event items but gain new fields:

```typescript
// Stored in Event item at PK: EVENT#eventId, SK: METADATA
{
  id: "evt_123",
  name: "HackMIT 2024",
  prizes: [
    {
      id: "prize_1",              // New: Unique identifier
      title: "Best Overall",
      amount: "$5,000",
      description: "...",
      maxWinners: 1,              // New: Winner capacity
      currentWinners: 0           // New: Current count (denormalized for quick access)
    }
  ]
}
```

**Note**: `currentWinners` is denormalized for performance. It's updated when prize awards are created/deleted to avoid counting queries.

## Components and Interfaces

### 1. Prize Management Components

#### PrizeForm Component (Enhanced)

```typescript
interface PrizeFormProps {
  initialData?: Partial<Prize>;
  onSubmit: (prize: Omit<Prize, "id" | "currentWinners">) => void;
  onCancel: () => void;
}
```

**New Fields:**

- `maxWinners`: Number input with default value of 1
- Validation: Must be positive integer
- Help text: "How many projects can win this prize?"

#### PrizeCard Component (Enhanced)

```typescript
interface PrizeCardProps {
  prize: Prize;
  winningProjects?: Project[]; // New: Show winning projects
  showWinners?: boolean; // New: Toggle winner display
  eventId: string;
}
```

**Enhanced Display:**

- Winner count indicator: "2 of 3 winners selected"
- Progress bar for multi-winner prizes
- List of winning project names (when showWinners=true)

### 2. Project Display Components

#### ProjectCard Component (Enhanced)

```typescript
interface ProjectCardProps {
  project: Project;
  showPrizes?: boolean; // New: Toggle prize display
  prioritizePrizes?: boolean; // New: Visual emphasis for winners
}
```

**New Prize Display Elements:**

- Prize winner badge/icon
- Prize count indicator
- Hover tooltip with prize details
- Special styling for prize winners

#### ProjectDetail Component (Enhanced)

```typescript
interface ProjectDetailProps {
  project: Project;
  event: Event; // New: Needed for prize context
}
```

**New Prize Section:**

- Dedicated "Awards & Recognition" section
- Prize cards showing title, amount, description
- Award date and event context
- Empty state when no prizes won

### 3. Filtering and Search Components

#### FilterControls Component (Enhanced)

```typescript
interface FilterControlsProps {
  // ... existing props
  onPrizeStatusChange: (status: PrizeFilterStatus) => void; // New
  prizeStatus: PrizeFilterStatus; // New
}

type PrizeFilterStatus = "all" | "winners" | "no-prizes";
```

**New Filter Options:**

- Prize Status dropdown with three options:
  - "All Projects" (default)
  - "Prize Winners Only"
  - "No Prizes"
- Clear visual indication of active prize filters

#### SearchResults Component (Enhanced)

```typescript
interface SearchResultsProps {
  // ... existing props
  prioritizePrizeWinners?: boolean; // New: Sort winners first
}
```

**Enhanced Sorting Logic:**

- Default sort: Prize winners first, then by existing criteria
- Maintain secondary sort options (date, title, popularity)
- Visual separation between prize winners and other projects

## Data Models

### Service Layer Extensions

#### PrizeAwardService

```typescript
interface IPrizeAwardService {
  // Create prize award (when project wins)
  create(
    award: Omit<PrizeAward, "id" | "awardedAt">
  ): Promise<ServiceResponse<PrizeAward>>;

  // Get all awards for a project
  getByProject(projectId: string): Promise<ServiceResponse<PrizeAward[]>>;

  // Get all awards for a prize
  getByPrize(prizeId: string): Promise<ServiceResponse<PrizeAward[]>>;

  // Get all awards for an event
  getByEvent(eventId: string): Promise<ServiceResponse<PrizeAward[]>>;

  // Remove prize award
  remove(awardId: string): Promise<ServiceResponse<void>>;

  // Check if prize has available slots
  canAwardPrize(prizeId: string): Promise<ServiceResponse<boolean>>;
}
```

#### Enhanced ProjectService

```typescript
// New method for prize-aware project queries
async getAllWithPrizes(eventId?: string): Promise<ServiceResponse<Project[]>>;

// Enhanced getById to include prize information
async getById(id: string): Promise<ServiceResponse<Project & { prizeAwards: PrizeAward[] }>>;
```

#### Enhanced EventService

```typescript
// Enhanced to include prize winner counts
async getById(id: string): Promise<ServiceResponse<Event & { prizesWithWinners: Prize[] }>>;
```

### Utility Functions

#### Prize Utilities

```typescript
// lib/utils/prizes.ts
export function calculatePrizeStatus(project: Project): "winner" | "none" {
  return project.prizeAwards.length > 0 ? "winner" : "none";
}

export function sortProjectsByPrizeStatus(projects: Project[]): Project[] {
  return projects.sort((a, b) => {
    const aHasPrizes = a.prizeAwards.length > 0;
    const bHasPrizes = b.prizeAwards.length > 0;

    if (aHasPrizes && !bHasPrizes) return -1;
    if (!aHasPrizes && bHasPrizes) return 1;
    return 0;
  });
}

export function filterProjectsByPrizeStatus(
  projects: Project[],
  status: PrizeFilterStatus
): Project[] {
  switch (status) {
    case "winners":
      return projects.filter((p) => p.prizeAwards.length > 0);
    case "no-prizes":
      return projects.filter((p) => p.prizeAwards.length === 0);
    default:
      return projects;
  }
}
```

## Error Handling

### Prize Award Validation

- **Duplicate Awards**: Prevent same project from winning same prize twice
- **Prize Capacity**: Validate that prize hasn't exceeded maxWinners
- **Event Consistency**: Ensure project and prize belong to same event
- **Data Integrity**: Validate all referenced IDs exist

### Error Messages

```typescript
const PRIZE_ERRORS = {
  PRIZE_FULL:
    "This prize has already been awarded to the maximum number of projects",
  DUPLICATE_AWARD: "This project has already won this prize",
  INVALID_PROJECT: "Project not found or not part of this event",
  INVALID_PRIZE: "Prize not found or not part of this event",
  INSUFFICIENT_PERMISSIONS:
    "You don't have permission to award prizes for this event",
};
```

### Graceful Degradation

- **Missing Prize Data**: Show projects without prize information if awards fail to load
- **Partial Prize Loading**: Display available prize information even if some awards fail to load
- **Filter Fallback**: Maintain basic project filtering if prize filtering fails

## Testing Strategy

### Unit Tests

- Prize award creation and validation logic
- Project sorting with prize status
- Filter functions for prize status
- Prize capacity validation

### Integration Tests

- Complete prize award workflow
- Project display with prize information
- Filter interactions with prize status
- Event page prize winner prioritization

### E2E Tests

- Create event with multi-winner prizes
- Award prizes to projects (future functionality)
- Filter projects by prize status
- Navigate between event and project pages with prize context

## Performance Considerations

### Data Loading Optimization

- **Batch Prize Loading**: Load all prize awards for an event in single query
- **Computed Fields**: Pre-calculate `hasPrizes` field to avoid runtime computation
- **Selective Loading**: Only load prize details when needed (lazy loading)

### Caching Strategy

- **Project Lists**: Cache project lists with prize status for faster filtering
- **Prize Counts**: Cache prize winner counts to avoid repeated calculations
- **Event Prize Data**: Cache complete prize information for event pages

### Query Optimization

- **GSI Usage**: Leverage GSI patterns for efficient prize award queries
- **Projection**: Only fetch required fields for list views
- **Pagination**: Implement pagination for events with many prize winners

## DynamoDB Adapter Integration

The existing `DynamoDBAdapter` needs minimal changes to support prize awards:

### New parseKey Pattern

```typescript
case 'prize-award':
  // prize-award:evt_123:prize_1:proj_456 →
  // PK: EVENT#evt_123, SK: PRIZE-AWARD#prize_1#proj_456
  if (parts.length === 4) {
    return {
      PK: `EVENT#${parts[1]}`,
      SK: `PRIZE-AWARD#${parts[2]}#${parts[3]}`
    };
  }
  throw new Error(`Invalid prize-award key format: "${key}"`);
```

### New generateGSIKeys Pattern

```typescript
else if (PK.startsWith('EVENT#') && SK.startsWith('PRIZE-AWARD#')) {
  // Prize award entity - GSI1 for project access
  const projectId = item.projectId as string | undefined;
  const prizeId = item.prizeId as string | undefined;

  if (projectId && prizeId) {
    gsiKeys.GSI1PK = `PROJECT#${projectId}`;
    gsiKeys.GSI1SK = `PRIZE-AWARD#${prizeId}`;
  }
}
```

### New getAll Pattern

```typescript
case 'prize-award':
  // prize-award:evt_123: → All awards for event
  if (parts.length === 2 || (parts.length === 3 && parts[2] === '')) {
    const eventId = parts[1];
    const PK = `EVENT#${eventId}`;
    const skPrefix = 'PRIZE-AWARD#';
    await this.queryWithPagination(PK, skPrefix, items);
  }
  // prize-award:evt_123:prize_1: → All awards for specific prize
  else if (parts.length === 3 || (parts.length === 4 && parts[3] === '')) {
    const eventId = parts[1];
    const prizeId = parts[2];
    const PK = `EVENT#${eventId}`;
    const skPrefix = `PRIZE-AWARD#${prizeId}#`;
    await this.queryWithPagination(PK, skPrefix, items);
  }
  break;
```

## Migration Strategy

### Phase 1: Data Model Extension

1. **Update Prize interface** (maxWinners, currentWinners, id fields)
2. **Create PrizeAward interface** and type definitions
3. **Extend DynamoDB adapter** with prize-award key patterns
4. **Create PrizeAwardService** with CRUD operations
5. **Migration script** to add IDs and default values to existing prizes

### Phase 2: Display Enhancement

1. **Update ProjectCard** to show prize indicators
2. **Add prize section** to ProjectDetail page
3. **Enhance event pages** to show prize winners first
4. **Implement prize status filtering** in FilterControls
5. **Add prize utilities** for sorting and filtering

### Phase 3: Prize Management (Future)

1. **Add prize awarding interface** for event organizers
2. **Implement prize award notifications**
3. **Add prize analytics and reporting**
4. **Enable bulk prize operations**

### Backward Compatibility

- **All new fields are optional or have defaults**
- **Existing projects work without prize information**
- **Graceful handling of missing prize data**
- **No breaking changes to existing APIs**
- **Migration script handles existing data**

### Data Migration Script

```typescript
// scripts/migrate-prizes.ts
async function migratePrizes() {
  const events = await eventService.getAll();

  for (const event of events.data || []) {
    const updatedPrizes = event.prizes.map((prize, index) => ({
      ...prize,
      id: prize.id || `prize_${event.id}_${index}`,
      maxWinners: prize.maxWinners || 1,
      currentWinners: prize.currentWinners || 0,
    }));

    await eventService.update(event.id, { prizes: updatedPrizes });
  }
}
```
