---
inclusion: manual
---

# Testing Patterns and Best Practices

## Critical Learnings from DynamoDB Migration Testing

This document captures testing patterns learned during the DynamoDB migration, focusing on end-to-end testing with Playwright and regression testing strategies.

---

## 1. End-to-End Testing with Playwright

### When to Use E2E Testing

Use Playwright for:
- ✅ Complete user flows (create → view → edit)
- ✅ Data persistence verification
- ✅ Backend integration testing
- ✅ Regression testing after major changes
- ✅ Cross-page navigation flows

Don't use Playwright for:
- ❌ Unit testing individual functions
- ❌ Component testing in isolation
- ❌ Testing internal implementation details

### Testing Complete Flows

```typescript
// ✅ GOOD: Test complete user journey
test('create event and submit project', async () => {
  // 1. Navigate to events
  await page.goto('http://localhost:3000/events');
  
  // 2. Create event
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('textbox', { name: 'Event Name' }).fill('Test Event');
  await page.getByRole('button', { name: 'Create Event' }).click();
  
  // 3. Verify redirect to event detail
  expect(page.url()).toContain('/events/event_');
  
  // 4. Submit project
  await page.getByRole('button', { name: 'Submit Project' }).click();
  await page.getByRole('textbox', { name: 'Project Name' }).fill('Test Project');
  await page.getByRole('button', { name: 'Submit Project' }).click();
  
  // 5. Verify project appears on event page
  await page.goto(eventUrl);
  await expect(page.getByText('Test Project')).toBeVisible();
});
```

```typescript
// ❌ BAD: Testing isolated actions without context
test('click create button', async () => {
  await page.getByRole('button', { name: 'Create Event' }).click();
  // What now? No verification of actual functionality
});
```

---

## 2. Verifying Backend Integration

### Check Console Logs for DynamoDB Operations

```typescript
// Monitor console for DynamoDB query logs
const consoleLogs: string[] = [];

page.on('console', msg => {
  if (msg.type() === 'log') {
    consoleLogs.push(msg.text());
  }
});

await page.goto('http://localhost:3000/events');

// Verify DynamoDB query executed
const dynamoLog = consoleLogs.find(log => 
  log.includes('Retrieved') && log.includes('items with prefix: event:')
);
expect(dynamoLog).toBeDefined();
```

### Verify No Errors in Console

```typescript
const errors: string[] = [];

page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push(msg.text());
  }
});

await page.goto('http://localhost:3000/events');

// Should have no environment variable errors
expect(errors).not.toContain(
  expect.stringContaining('DYNAMODB_TABLE_NAME environment variable is required')
);
```

---

## 3. Testing Data Persistence

### Verify Data Across Page Navigations

```typescript
test('data persists across navigation', async () => {
  // 1. Create event
  await createEvent('Test Event');
  const eventId = extractIdFromUrl(page.url());
  
  // 2. Navigate away
  await page.goto('http://localhost:3000');
  
  // 3. Navigate back to events list
  await page.goto('http://localhost:3000/events');
  
  // 4. Verify event still appears
  await expect(page.getByText('Test Event')).toBeVisible();
  
  // 5. Navigate to event detail
  await page.goto(`http://localhost:3000/events/${eventId}`);
  
  // 6. Verify all event data still present
  await expect(page.getByRole('heading', { name: 'Test Event' })).toBeVisible();
});
```

---

## 4. Testing Relationships

### Verify Parent-Child Relationships

```typescript
test('project appears on event page', async () => {
  // 1. Create event
  await createEvent('Parent Event');
  const eventId = extractIdFromUrl(page.url());
  
  // 2. Submit project to event
  await page.getByRole('button', { name: 'Submit Project' }).click();
  await fillProjectForm('Child Project');
  await page.getByRole('button', { name: 'Submit Project' }).click();
  
  // 3. Navigate back to event
  await page.goto(`http://localhost:3000/events/${eventId}`);
  
  // 4. Verify project appears in event's project list
  await expect(page.getByText('Child Project')).toBeVisible();
  
  // 5. Verify project count updated
  const projectSection = page.getByRole('region', { name: 'Submitted Projects' });
  await expect(projectSection.getByText('Child Project')).toBeVisible();
});
```

---

## 5. Form Testing Patterns

### Fill Forms Completely

```typescript
// ✅ GOOD: Fill all required fields
async function fillEventForm(data: EventData) {
  await page.getByRole('textbox', { name: 'Event Name' }).fill(data.name);
  await page.getByRole('textbox', { name: 'Description' }).fill(data.description);
  await page.getByRole('textbox', { name: 'Start Date' }).fill(data.startDate);
  await page.getByRole('textbox', { name: 'End Date' }).fill(data.endDate);
  await page.getByRole('textbox', { name: 'Location' }).fill(data.location);
  await page.getByRole('textbox', { name: 'Organizer Name' }).fill(data.organizer);
  
  // Fill prize information
  await page.getByRole('textbox', { name: 'Prize Title' }).fill(data.prizeTitle);
  await page.getByRole('textbox', { name: 'Prize Amount' }).fill(data.prizeAmount);
}
```

```typescript
// ❌ BAD: Partial form filling
async function fillEventForm(name: string) {
  await page.getByRole('textbox', { name: 'Event Name' }).fill(name);
  // Missing required fields - form won't submit!
}
```

### Verify Form Submission Success

```typescript
test('form submission succeeds', async () => {
  await fillEventForm(testData);
  await page.getByRole('button', { name: 'Create Event' }).click();
  
  // Wait for success message
  await expect(page.getByText('Event created successfully!')).toBeVisible();
  
  // Verify redirect
  await page.waitForURL(/\/events\/event_/);
  
  // Verify data on detail page
  await expect(page.getByRole('heading', { name: testData.name })).toBeVisible();
});
```

---

## 6. Waiting Strategies

### Wait for Navigation

```typescript
// ✅ GOOD: Wait for URL change
await page.getByRole('button', { name: 'Create Event' }).click();
await page.waitForURL(/\/events\/event_/);

// ✅ GOOD: Wait for specific time when needed
await page.waitForTimeout(1000); // Wait for redirect
```

```typescript
// ❌ BAD: No waiting
await page.getByRole('button', { name: 'Create Event' }).click();
// Immediately check URL - might not have changed yet!
expect(page.url()).toContain('/events/');
```

### Wait for Elements

```typescript
// ✅ GOOD: Wait for element to appear
await expect(page.getByText('Event created successfully!')).toBeVisible();

// ✅ GOOD: Wait for element to disappear
await expect(page.getByText('Loading...')).not.toBeVisible();
```

---

## 7. Test Data Management

### Use Descriptive Test Data

```typescript
// ✅ GOOD: Descriptive, identifiable test data
const testEvent = {
  name: 'Test Hackathon 2025',
  description: 'A test hackathon event to verify DynamoDB integration',
  startDate: '2025-11-01',
  endDate: '2025-11-03',
  location: 'Virtual Event',
  organizer: 'Test Organizer',
};

const testProject = {
  name: 'Test Project - DynamoDB Integration',
  description: 'This is a test project to verify the complete end-to-end flow',
  githubUrl: 'https://github.com/test/dynamodb-integration',
  technologies: ['Next.js', 'DynamoDB'],
};
```

```typescript
// ❌ BAD: Generic, hard to identify test data
const testEvent = {
  name: 'Event 1',
  description: 'Test',
  // ...
};
```

### Clean Up Test Data (Optional)

```typescript
// For development testing, cleanup is optional
// For CI/CD, implement cleanup

afterEach(async () => {
  // Optional: Delete test data
  if (process.env.CI) {
    await deleteTestEvent(eventId);
    await deleteTestProject(projectId);
  }
});
```

---

## 8. Regression Testing Strategy

### What to Test After Major Changes

After migrating to DynamoDB, test:

1. **Data Operations**
   - [ ] Create new records
   - [ ] Read existing records
   - [ ] Update records
   - [ ] List all records

2. **Navigation Flows**
   - [ ] Homepage → Events → Event Detail
   - [ ] Event Detail → Submit Project → Project Detail
   - [ ] Projects List → Project Detail

3. **Relationships**
   - [ ] Projects appear on event pages
   - [ ] Events appear in events list
   - [ ] Projects appear in projects list

4. **Error Handling**
   - [ ] No console errors
   - [ ] No environment variable errors
   - [ ] Form validation works

5. **Performance**
   - [ ] Pages load in reasonable time
   - [ ] No excessive queries
   - [ ] Redirects work smoothly

### Document Test Results

```markdown
# Regression Test Report

**Date**: 2025-10-16
**Environment**: Local Development
**Database**: AWS DynamoDB

## Test Results

✅ Event Creation Flow (5/5 steps passed)
✅ Project Submission Flow (5/5 steps passed)
✅ Data Persistence (3/3 checks passed)
✅ Relationships (2/2 verifications passed)
✅ Performance (all within acceptable range)

## Issues Found

None - all functionality working as expected.

## DynamoDB Operations Verified

- Event creation: ✅
- Event retrieval: ✅ (Retrieved 3 items)
- Project creation: ✅
- Project retrieval: ✅ (Retrieved 1 item)
```

---

## 9. Common Testing Pitfalls

### Pitfall 1: Not Waiting for Async Operations

```typescript
// ❌ BAD
await page.getByRole('button', { name: 'Submit' }).click();
expect(page.url()).toContain('/success'); // Might fail - too fast!

// ✅ GOOD
await page.getByRole('button', { name: 'Submit' }).click();
await page.waitForURL(/\/success/);
expect(page.url()).toContain('/success');
```

### Pitfall 2: Testing Implementation Details

```typescript
// ❌ BAD: Testing internal state
expect(component.state.isLoading).toBe(false);

// ✅ GOOD: Testing user-visible behavior
await expect(page.getByText('Loading...')).not.toBeVisible();
await expect(page.getByText('Event created successfully!')).toBeVisible();
```

### Pitfall 3: Brittle Selectors

```typescript
// ❌ BAD: Fragile CSS selectors
await page.locator('.btn-primary.submit-btn').click();

// ✅ GOOD: Semantic role-based selectors
await page.getByRole('button', { name: 'Submit' }).click();
```

### Pitfall 4: Not Verifying Backend Operations

```typescript
// ❌ BAD: Only checking UI
await page.getByRole('button', { name: 'Create' }).click();
await expect(page.getByText('Success')).toBeVisible();
// But did it actually save to DynamoDB?

// ✅ GOOD: Verify backend operation
await page.getByRole('button', { name: 'Create' }).click();
await expect(page.getByText('Success')).toBeVisible();

// Navigate away and back to verify persistence
await page.goto('/');
await page.goto('/events');
await expect(page.getByText('Test Event')).toBeVisible();
```

---

## 10. Test Organization

### Structure Tests by User Flow

```typescript
describe('Event Management Flow', () => {
  test('create event', async () => { /* ... */ });
  test('view event details', async () => { /* ... */ });
  test('edit event', async () => { /* ... */ });
  test('submit project to event', async () => { /* ... */ });
});

describe('Project Management Flow', () => {
  test('submit project', async () => { /* ... */ });
  test('view project details', async () => { /* ... */ });
  test('edit project', async () => { /* ... */ });
});
```

### Use Helper Functions

```typescript
// helpers.ts
export async function createEvent(page: Page, data: EventData) {
  await page.goto('http://localhost:3000/events/create');
  await fillEventForm(page, data);
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.waitForURL(/\/events\/event_/);
  return extractIdFromUrl(page.url());
}

export async function submitProject(page: Page, eventId: string, data: ProjectData) {
  await page.goto(`http://localhost:3000/projects/submit?eventId=${eventId}`);
  await fillProjectForm(page, data);
  await page.getByRole('button', { name: 'Submit Project' }).click();
  await page.waitForURL(/\/projects\/project_/);
  return extractIdFromUrl(page.url());
}

// test.ts
test('complete flow', async () => {
  const eventId = await createEvent(page, testEventData);
  const projectId = await submitProject(page, eventId, testProjectData);
  
  // Verify relationship
  await page.goto(`http://localhost:3000/events/${eventId}`);
  await expect(page.getByText(testProjectData.name)).toBeVisible();
});
```

---

## Summary

**Testing Best Practices**:

1. ✅ Test complete user flows, not isolated actions
2. ✅ Verify backend operations via console logs
3. ✅ Test data persistence across navigations
4. ✅ Verify parent-child relationships
5. ✅ Use descriptive test data
6. ✅ Wait for async operations
7. ✅ Use semantic selectors (roles, labels)
8. ✅ Document test results
9. ✅ Organize tests by user flow
10. ✅ Create reusable helper functions

**What to Avoid**:

1. ❌ Testing implementation details
2. ❌ Brittle CSS selectors
3. ❌ Not waiting for async operations
4. ❌ Partial form filling
5. ❌ Not verifying backend operations
6. ❌ Generic test data
7. ❌ Testing in isolation without context

Following these patterns ensures comprehensive, reliable, and maintainable tests.
