# Implementation Plan

- [x] 1. Set up DynamoDB infrastructure and local development environment

  - Create CloudFormation template for DynamoDB table with PK, SK, GSI1, and GSI2
  - Create Docker Compose configuration for DynamoDB Local
  - Write setup script to create local table with proper schema
  - Add npm scripts for local setup and seeding
  - _Requirements: 1, 9, 10, 11_

- [x] 2. Implement AWS configuration management

  - [x] 2.1 Create AWS configuration module

    - Write `lib/config/aws.ts` with `getAWSConfig()` function
    - Read environment variables with fallbacks
    - Validate required configuration
    - Support local development endpoint override
    - _Requirements: 3_

  - [x] 2.2 Create DynamoDB client singleton

    - Implement `getDynamoDBClient()` with connection pooling
    - Implement `getDocumentClient()` with marshalling options
    - Configure retry logic and timeouts
    - _Requirements: 3, 7_

- [x] 3. Implement DynamoDB adapter

  - [x] 3.1 Create DynamoDBAdapter class structure

    - Implement class that implements IStorageAdapter interface
    - Set up constructor with configuration
    - Initialize DynamoDB Document Client
    - _Requirements: 2_

  - [x] 3.2 Implement key translation logic

    - Write `parseKey()` method to convert storage keys to PK/SK
    - Write `buildKey()` method to convert PK/SK back to storage keys
    - Handle entity type detection (event, project, user)
    - _Requirements: 1, 2_

  - [x] 3.3 Implement GSI key generation

    - Write helper to generate GSI1PK/GSI1SK based on entity type
    - Write helper to generate GSI2PK/GSI2SK for user roles
    - Add logic to populate GSI keys during item creation
    - _Requirements: 1, 6_

  - [x] 3.4 Implement get method

    - Parse key into PK and SK
    - Execute GetCommand with error handling
    - Return item or null if not found
    - Add retry logic with exponential backoff
    - _Requirements: 2, 7_

  - [x] 3.5 Implement set method

    - Parse key into PK and SK
    - Add GSI keys based on entity type
    - Add/update timestamps (createdAt, updatedAt)
    - Execute PutCommand with error handling
    - Implement retry logic for throttling
    - _Requirements: 2, 7_

  - [x] 3.6 Implement remove method

    - Parse key into PK and SK
    - Execute DeleteCommand with error handling
    - _Requirements: 2, 7_

  - [x] 3.7 Implement getAll method

    - Determine query strategy based on prefix
    - For entity-level queries: use Scan with filter
    - For parent-child queries: use Query with PK
    - Implement pagination handling
    - _Requirements: 2, 6_

  - [x] 3.8 Implement clear method

    - Query all items in table
    - Batch delete items
    - Handle pagination for large datasets
    - _Requirements: 2_

- [x] 4. Update storage factory

  - Modify `lib/utils/storage.ts` to return DynamoDBAdapter by default
  - Add environment variable check for backward compatibility
  - Support toggling between localStorage and DynamoDB adapters
  - _Requirements: 4_

- [x] 4.5. Update service layer for DynamoDB key patterns

  - [x] 4.5.1 Update eventService to use DynamoDB key patterns

    - Replace `storage.get(STORAGE_KEYS.EVENTS)` with `storage.getAll("event:")`
    - Replace array-based storage with individual item operations
    - Update `getById()` to use `storage.get("event:eventId")`
    - Update `create()` to use `storage.set("event:eventId", event)`
    - Update `update()` to use `storage.get()` and `storage.set()` for individual events
    - Update `getByOrganizer()` to use `storage.getAll("event:")` with filtering
    - _Requirements: 2, 4_

  - [x] 4.5.2 Update projectService to use DynamoDB key patterns

    - Replace `storage.get(STORAGE_KEYS.PROJECTS)` with `storage.getAll("project:eventId:")`
    - Replace array-based storage with individual item operations
    - Update `getById()` to use `storage.get("project:eventId:projectId")`
    - Update `create()` to use `storage.set("project:eventId:projectId", project)`
    - Update `update()` to use `storage.get()` and `storage.set()` for individual projects
    - Update `getByEvent()` to use `storage.getAll("project:eventId:")`
    - Update `getByHacker()` to use `storage.getAll("project:")` with filtering
    - _Requirements: 2, 4_

  - [x] 4.5.3 Remove STORAGE_KEYS constants
    - Remove `STORAGE_KEYS.EVENTS` and `STORAGE_KEYS.PROJECTS` from storage.ts
    - Update any remaining references to use DynamoDB key patterns
    - _Requirements: 4_

- [x] 5. Update Next.js configuration for SSR

  - [x] 5.1 Remove static export configuration

    - Remove `output: 'export'` from next.config.ts
    - Update image configuration for optimized images
    - _Requirements: 8, 13_

  - [x] 5.2 Convert pages to Server Components

    - Remove "use client" directive from event listing page
    - Remove "use client" directive from event detail page
    - Remove "use client" directive from project detail page
    - Verify data fetching works during SSR
    - _Requirements: 8_

- [x] 6. Create environment configuration files

  - Create `.env.local.example` with all required variables
  - Create `.env.production.example` for production deployments
  - Document environment variables for each platform (Amplify, Vercel, Netlify)
  - _Requirements: 3, 10_

- [x] 7. Implement deployment configurations

  - [x] 7.1 Update AWS Amplify configuration

    - Update amplify.yml for SSR build
    - Document IAM compute role setup
    - _Requirements: 10_

  - [x] 7.2 Create Vercel configuration

    - Create vercel.json (if needed)
    - Document environment variable setup
    - _Requirements: 10_

  - [x] 7.3 Create Netlify configuration
    - Create netlify.toml with Next.js plugin
    - Document environment variable setup
    - _Requirements: 10_

- [x] 8. Create infrastructure deployment scripts

  - [x] 8.1 Create CloudFormation deployment script

    - Write script to deploy CloudFormation template
    - Add parameter handling for environment
    - Output table name and ARN
    - _Requirements: 9_

  - [x] 8.2 Create IAM policy document

    - Write JSON policy for DynamoDB access
    - Document how to attach to Amplify compute role
    - Document how to create IAM user for Vercel/Netlify
    - _Requirements: 9, 10_

- [ ] 9. Create data migration utilities

  - [ ] 9.1 Create localStorage export script

    - Write script to export data from localStorage to JSON
    - Handle all entity types (events, projects)
    - Validate exported data structure
    - _Requirements: 5_

  - [ ] 9.2 Create DynamoDB import script

    - Write script to import JSON data into DynamoDB
    - Transform data to include PK, SK, and GSI keys
    - Use BatchWriteItem for efficient imports
    - Add progress logging and error handling
    - _Requirements: 5_

  - [ ] 9.3 Create data validation script
    - Write script to compare localStorage and DynamoDB data
    - Verify all items migrated correctly
    - Report any discrepancies
    - _Requirements: 5_

- [x] 10. Implement health check endpoint

  - Create `/api/health` route
  - Test DynamoDB connectivity
  - Return status and error information
  - _Requirements: 10_

- [x] 10.5. Fix Next.js 15 async params warnings

  - [x] 10.5.1 Update event detail page

    - Change `params: { id: string }` to `params: Promise<{ id: string }>`
    - Update to `const { id } = await params`
    - _Requirements: 8_

  - [x] 10.5.2 Update project detail page
    - Change `params: { id: string }` to `params: Promise<{ id: string }>`
    - Update to `const { id } = await params`
    - _Requirements: 8_

- [x] 10.6. Convert form pages to Server Components with API routes

  - [x] 10.6.1 Create API routes for write operations

    - Create `POST /api/events` for event creation
    - Create `PATCH /api/events/[id]` for event updates
    - Create `POST /api/projects` for project creation
    - Create `PATCH /api/projects/[id]` for project updates
    - All routes call service layer on server
    - _Requirements: 2, 4, 8_

  - [x] 10.6.2 Update events create/edit page

    - Convert `page.tsx` to Server Component
    - Fetch event data on server if in edit mode
    - Create `EventCreateClient.tsx` for form interactivity
    - Update client to use `fetch()` to call API routes
    - Add loading state
    - _Requirements: 4, 8_

  - [x] 10.6.3 Update projects submit/edit page

    - Convert `page.tsx` to Server Component
    - Fetch event and project data on server
    - Create `ProjectSubmitClient.tsx` for form interactivity
    - Update client to use `fetch()` to call API routes
    - Add loading state
    - _Requirements: 4, 8_

  - [x] 10.6.4 Convert projects list page to Server Component
    - Convert `page.tsx` to Server Component
    - Fetch all projects on server
    - Create `ProjectsClient.tsx` for interactivity
    - Add loading state
    - _Requirements: 4, 8_

- [x] 10.7. End-to-end regression testing

  - [x] 10.7.1 Test event creation flow

    - Navigate to events page
    - Create new event with complete form data
    - Verify event created in DynamoDB
    - Verify redirect to event detail page
    - _Requirements: 1, 2, 4, 8_

  - [x] 10.7.2 Test project submission flow

    - Navigate from event to project submission
    - Submit project with complete form data
    - Verify project created in DynamoDB
    - Verify redirect to project detail page
    - _Requirements: 1, 2, 4, 8_

  - [x] 10.7.3 Verify data relationships

    - Verify project appears on event detail page
    - Verify event appears in events list
    - Verify project appears in projects list
    - Verify all DynamoDB queries successful
    - _Requirements: 1, 2, 6_

  - [x] 10.7.4 Create test report
    - Document all test steps and results
    - Include DynamoDB query logs
    - Document performance observations
    - Create comprehensive regression test report
    - _Requirements: 12_

- [x] 11. Add error handling and logging

  - [x] 11.1 Implement retry logic with exponential backoff

    - Create `executeWithRetry()` helper function
    - Handle throttling errors specifically
    - Configure max retries and backoff strategy
    - _Requirements: 7_

  - [x] 11.2 Add structured logging

    - Implement logging helper in DynamoDBAdapter
    - Log all operations with context
    - Log errors with stack traces
    - _Requirements: 7_

  - [x] 11.3 Update service layer error handling
    - Ensure services catch adapter errors
    - Return appropriate ServiceResponse with error messages
    - Add user-friendly error messages
    - _Requirements: 7_

- [x] 12. Write unit tests for DynamoDB adapter

  - [x] 12.1 Test key translation logic

    - Test parseKey() with various key formats
    - Test buildKey() reconstruction
    - Test edge cases and invalid keys
    - _Requirements: 12_

  - [x] 12.2 Test GSI key generation

    - Test GSI1 key generation for events and projects
    - Test GSI2 key generation for users
    - Test sparse index behavior
    - _Requirements: 12_

  - [x] 12.3 Test CRUD operations with mocked client

    - Mock DynamoDB Document Client
    - Test get, set, remove, clear, getAll methods
    - Verify correct commands are sent
    - Test error handling paths
    - _Requirements: 12_

  - [x] 12.4 Test retry logic

    - Mock throttling errors
    - Verify exponential backoff behavior
    - Test max retry limit
    - _Requirements: 12_

- [ ]\* 13. Write integration tests

  - [ ]\* 13.1 Set up test environment with DynamoDB Local

    - Configure test to use DynamoDB Local endpoint
    - Create test table before tests
    - Clean up test data after tests
    - _Requirements: 12_

  - [ ]\* 13.2 Test event CRUD operations

    - Test creating events with proper keys
    - Test retrieving events by ID
    - Test querying events by organizer (GSI1)
    - Test updating and deleting events
    - _Requirements: 12_

  - [ ]\* 13.3 Test project CRUD operations

    - Test creating projects linked to events
    - Test retrieving projects by event
    - Test querying projects by hacker (GSI1)
    - Test updating and deleting projects
    - _Requirements: 12_

  - [ ]\* 13.4 Test user CRUD operations

    - Test creating users with role
    - Test querying users by email (GSI1)
    - Test querying users by role (GSI2)
    - _Requirements: 12_

  - [ ]\* 13.5 Test pagination
    - Create large dataset
    - Test getAll with pagination
    - Verify all items are retrieved
    - _Requirements: 12_

- [ ] 14. Create documentation

  - [ ] 14.1 Write local development setup guide

    - Document Docker and DynamoDB Local setup
    - Document environment variable configuration
    - Document npm scripts usage
    - _Requirements: 11_

  - [ ] 14.2 Write deployment guide

    - Document AWS Amplify deployment steps
    - Document Vercel deployment steps
    - Document Netlify deployment steps
    - Include IAM setup instructions
    - _Requirements: 10_

  - [ ] 14.3 Write migration guide

    - Document data migration process
    - Include rollback procedures
    - Document troubleshooting steps
    - _Requirements: 5_

  - [ ] 14.4 Update README
    - Update project description with DynamoDB
    - Update setup instructions
    - Add architecture diagram
    - _Requirements: 1, 10, 11_

- [ ] 15. Perform end-to-end testing

  - [ ] 15.1 Test locally with DynamoDB Local

    - Start DynamoDB Local
    - Run application locally
    - Test all CRUD operations through UI
    - Verify SSR works correctly
    - _Requirements: 11_

  - [ ] 15.2 Test deployment on AWS Amplify

    - Deploy infrastructure (DynamoDB table)
    - Configure IAM compute role
    - Deploy application
    - Test all functionality in production
    - _Requirements: 10_

  - [ ] 15.3 Test deployment on Vercel or Netlify
    - Configure AWS credentials
    - Deploy application
    - Test all functionality
    - Verify SSR works correctly
    - _Requirements: 10_

- [x] 16. Performance optimization and monitoring

  - [x] 16.1 Verify query patterns use Query not Scan

    - Review all data access patterns
    - Ensure efficient use of indexes
    - _Requirements: 6_

  - [x] 16.2 Set up CloudWatch monitoring

    - Document key metrics to monitor

    - Create sample CloudWatch dashboard
    - _Requirements: 7_

  - [x] 16.3 Test cold start performance
    - Measure SSR response times
    - Verify connection pooling works
    - _Requirements: 10_
