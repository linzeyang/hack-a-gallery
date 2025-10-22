# Implementation Plan

- [x] 1. Update Prize Data Model and Types

  - Add `id`, `maxWinners`, and `currentWinners` fields to Prize interface
  - Create PrizeAward interface with all required fields
  - Update Event type to include enhanced Prize interface
  - Update Project type to include prizeAwards array and hasPrizes flag
  - Add PrizeFilterStatus type for filtering
  - _Requirements: 1, 4, 6_

- [x] 1.1 Update Prize interface

  - Add `id: string` field to Prize interface in `lib/types/event.ts`
  - Add `maxWinners: number` field with default value of 1
  - Add `currentWinners: number` field with default value of 0
  - Update Prize type exports
  - _Requirements: 6_

- [x] 1.2 Create PrizeAward interface

  - Create new file `lib/types/prize.ts` for prize-related types
  - Define PrizeAward interface with id, projectId, prizeId, eventId, awardedAt, awardedBy fields
  - Export PrizeAward interface
  - Add PrizeFilterStatus type: 'all' | 'winners' | 'no-prizes'
  - _Requirements: 1, 4_

- [x] 1.3 Update Project interface

  - Add `prizeAwards: PrizeAward[]` field to Project interface in `lib/types/project.ts`
  - Add `hasPrizes: boolean` computed field for quick filtering
  - Import PrizeAward type from prize.ts
  - Update Project type exports
  - _Requirements: 1, 2_

- [x] 2. Extend DynamoDB Adapter for Prize Awards

  - Add prize-award key parsing to parseKey method
  - Add prize-award GSI generation to generateGSIKeys method
  - Add prize-award query patterns to getAll method
  - Add prize-award key building to buildKey method
  - Update entity type detection for prize awards
  - _Requirements: 4_

- [x] 2.1 Add prize-award parseKey pattern

  - Add case for 'prize-award' in parseKey switch statement
  - Handle format: `prize-award:eventId:prizeId:projectId`
  - Map to PK: `EVENT#eventId`, SK: `PRIZE-AWARD#prizeId#projectId`
  - Add validation for 4-part key format
  - Add appropriate error messages
  - _Requirements: 4_

- [x] 2.2 Add prize-award GSI generation

  - Add condition for prize-award items in generateGSIKeys method
  - Check if PK starts with 'EVENT#' and SK starts with 'PRIZE-AWARD#'
  - Generate GSI1PK: `PROJECT#projectId` from item.projectId
  - Generate GSI1SK: `PRIZE-AWARD#prizeId` from item.prizeId
  - Add to returned gsiKeys object
  - _Requirements: 4_

- [x] 2.3 Add prize-award getAll patterns

  - Add case for 'prize-award' in getAll switch statement
  - Support pattern `prize-award:eventId:` for all awards in event
  - Support pattern `prize-award:eventId:prizeId:` for all awards for specific prize
  - Use queryWithPagination for efficient queries
  - Add appropriate error handling
  - _Requirements: 4_

- [x] 2.4 Add prize-award buildKey pattern

  - Add condition for PRIZE-AWARD SK pattern in buildKey method
  - Extract prizeId and projectId from SK
  - Return format: `prize-award:eventId:prizeId:projectId`
  - Add error handling for invalid SK format
  - _Requirements: 4_

- [x] 2.5 Update entity type detection

  - Add condition for prize-award entity type in set method
  - Check if PK starts with 'EVENT#' and SK starts with 'PRIZE-AWARD#'
  - Set entityType to 'PrizeAward'
  - Update logging to include prize-award operations
  - _Requirements: 4_

- [x] 3. Create PrizeAwardService

  - Create new PrizeAwardService class implementing IPrizeAwardService
  - Implement create, getByProject, getByPrize, getByEvent, remove methods
  - Add canAwardPrize validation method
  - Include proper error handling and ServiceResponse patterns
  - Add prize capacity validation and duplicate prevention
  - Export singleton instance
  - _Requirements: 4_

- [x] 3.1 Create service interface

  - Define IPrizeAwardService interface in `lib/types/service.ts`
  - Include method signatures for create, getByProject, getByPrize, getByEvent, remove, canAwardPrize
  - Use ServiceResponse<T> return types for consistency
  - Add JSDoc comments for each method
  - _Requirements: 4_

- [x] 3.2 Create PrizeAwardService class

  - Create new file `services/prizeAwardService.ts`
  - Implement PrizeAwardService class with IStorageAdapter
  - Set up storage adapter using getStorageAdapter()
  - Add generateId helper method for creating unique award IDs
  - Export singleton instance
  - _Requirements: 4_

- [x] 3.3 Implement create method

  - Implement create method accepting Omit<PrizeAward, 'id' | 'awardedAt'>
  - Generate unique ID and timestamp
  - Validate prize capacity using canAwardPrize
  - Check for duplicate awards (same project + prize)
  - Store using key format: `prize-award:eventId:prizeId:projectId`
  - Update prize currentWinners count in event
  - Return ServiceResponse with created award
  - _Requirements: 4_

- [x] 3.4 Implement query methods

  - Implement getByProject using storage.getAll with GSI1 query pattern
  - Implement getByPrize using storage.getAll with `prize-award:eventId:prizeId:` pattern
  - Implement getByEvent using storage.getAll with `prize-award:eventId:` pattern
  - Add proper error handling for each method
  - Return ServiceResponse with array of awards
  - _Requirements: 4_

- [x] 3.5 Implement remove and validation methods

  - Implement remove method to delete prize award by ID
  - Update prize currentWinners count when removing award
  - Implement canAwardPrize to check if prize has available slots
  - Add validation for event consistency (project and prize in same event)
  - Add appropriate error messages for each validation failure
  - _Requirements: 4_

- [x] 4. Create Prize Utility Functions

  - Create `lib/utils/prizes.ts` with helper functions
  - Implement calculatePrizeStatus function
  - Implement sortProjectsByPrizeStatus function
  - Implement filterProjectsByPrizeStatus function
  - Add TypeScript types and JSDoc documentation
  - _Requirements: 2, 3, 7_

- [x] 4.1 Create prize status utilities

  - Create calculatePrizeStatus function returning 'winner' | 'none'
  - Check if project.prizeAwards.length > 0
  - Add TypeScript types for return value
  - Include JSDoc documentation with examples
  - _Requirements: 2, 3_

- [x] 4.2 Create sorting utility

  - Create sortProjectsByPrizeStatus function accepting Project[]
  - Sort projects with prizes first, then others
  - Maintain stable sort for projects within same category
  - Return sorted Project[] array
  - Add JSDoc documentation
  - _Requirements: 7_

- [x] 4.3 Create filtering utility

  - Create filterProjectsByPrizeStatus function accepting projects and PrizeFilterStatus
  - Handle 'all', 'winners', 'no-prizes' filter options
  - Return filtered Project[] array
  - Add TypeScript types and JSDoc documentation
  - _Requirements: 3_

- [x] 5. Update ProjectCard Component

  - Add prize winner badge/icon to ProjectCard
  - Show prize count indicator
  - Add hover tooltip with prize details
  - Apply special styling for prize winners
  - Make prize display optional via showPrizes prop
  - _Requirements: 2_

- [x] 5.1 Add prize indicator UI

  - Create PrizeBadge component for winner indication
  - Add trophy or medal icon using appropriate icon library
  - Display prize count (e.g., "2 Prizes")
  - Style with gold/yellow accent colors
  - Position badge in top-right corner of card
  - _Requirements: 2_

- [x] 5.2 Add prize tooltip

  - Implement hover tooltip showing prize details
  - Display prize titles and amounts in tooltip
  - Use accessible tooltip component (aria-label, role)
  - Style tooltip consistently with design system
  - Add smooth fade-in/out transitions
  - _Requirements: 2_

- [x] 5.3 Update ProjectCard props and styling

  - Add showPrizes?: boolean prop to ProjectCardProps
  - Add prioritizePrizes?: boolean prop for visual emphasis
  - Apply subtle background or border for prize winners when prioritizePrizes=true
  - Ensure responsive design on mobile devices
  - Maintain accessibility standards
  - _Requirements: 2_

- [x] 6. Update ProjectDetail Page

  - Add "Awards & Recognition" section to project detail page
  - Display all prizes won by the project
  - Show prize title, amount, description, and award date
  - Include event context for each prize
  - Add empty state when no prizes won
  - Fetch prize award data in server component
  - _Requirements: 1_

- [x] 6.1 Fetch prize data in server component

  - Update project detail page.tsx to fetch prize awards
  - Use prizeAwardService.getByProject(projectId) in server component
  - Handle errors gracefully with try-catch
  - Pass prize awards to client component via props
  - Add loading state if needed
  - _Requirements: 1_

- [x] 6.2 Create PrizeSection component

  - Create new PrizeSection component in components/features
  - Accept prizeAwards and event props
  - Display section header "Awards & Recognition"
  - Map through prize awards and display prize cards
  - Show prize title, amount, description, award date
  - Include event name for context
  - _Requirements: 1_

- [x] 6.3 Create PrizeCard component

  - Create PrizeCard component for individual prize display
  - Show prize icon/badge
  - Display title, amount, description
  - Format award date (e.g., "Awarded on March 15, 2024")
  - Style with card layout and appropriate spacing
  - Make responsive for mobile devices
  - _Requirements: 1_

- [x] 6.4 Add empty state

  - Create empty state component for projects without prizes
  - Show friendly message (e.g., "No awards yet")
  - Use subtle styling to not draw too much attention
  - Ensure empty state is accessible
  - _Requirements: 1_

- [x] 7. Add Prize Status Filtering

  - Add prize status filter to FilterControls component
  - Implement "All Projects", "Prize Winners Only", "No Prizes" options
  - Update search utility to support prize filtering
  - Show active filter state clearly
  - Integrate with existing filter system
  - _Requirements: 3_

- [x] 7.1 Update FilterControls component

  - Add prize status dropdown to FilterControls component
  - Create dropdown with three options: All, Winners Only, No Prizes
  - Add onPrizeStatusChange prop to FilterControlsProps
  - Add prizeStatus prop to track current selection
  - Style consistently with existing technology and event filters
  - _Requirements: 3_

- [x] 7.2 Update search utilities

  - Extend filterAndSortProjects function in lib/utils/search.ts
  - Add prizeStatus parameter to filter options
  - Use filterProjectsByPrizeStatus utility function
  - Maintain existing filter logic for technology and events
  - Update function signature and JSDoc
  - _Requirements: 3_

- [x] 7.3 Update ProjectsClient integration

  - Add prizeStatus state to ProjectsClient using useState
  - Pass prizeStatus to FilterControls component
  - Pass prizeStatus to filterAndSortProjects function
  - Update handleClearAll to reset prize status filter
  - Show active prize filter in SearchResults component
  - _Requirements: 3_

- [x] 8. Implement Prize Winner Prioritization

  - Update event page to prioritize prize-winning projects
  - Sort projects with prize winners first by default
  - Maintain secondary sort options
  - Add visual distinction between winners and other projects
  - Update relevant components to support prioritization
  - _Requirements: 7_

- [x] 8.1 Update event page sorting

  - Fetch prize awards for event projects in event detail page
  - Apply sortProjectsByPrizeStatus utility before rendering
  - Maintain existing sort options (date, title) as secondary sort
  - Pass sorted projects to client component
  - Handle case where no projects have prizes
  - _Requirements: 7_

- [x] 8.2 Add visual distinction

  - Add section header or separator for prize winners section
  - Apply subtle background color or border to winner cards
  - Use "Prize Winners" heading above winner section
  - Ensure visual distinction is accessible (not color-only)
  - Maintain responsive design on mobile
  - _Requirements: 7_

- [x] 8.3 Update EventDetail component

  - Update EventDetail or EventClient component to show prioritized projects
  - Pass prioritizePrizes prop to ProjectCard components
  - Add conditional rendering for winners section
  - Ensure smooth transitions between sections
  - _Requirements: 7_

- [x] 9. Update Event Form for Prize Configuration

  - Add maxWinners field to prize form in event creation/editing
  - Set default value to 1
  - Add validation for positive integers
  - Include help text explaining the field
  - Update form submission to include new field
  - _Requirements: 6_

- [x] 9.1 Update PrizeForm component

  - Add maxWinners number input field to prize form
  - Set default value to 1
  - Add validation: must be positive integer >= 1
  - Add help text: "How many projects can win this prize?"
  - Style input consistently with other form fields
  - _Requirements: 6_

- [x] 9.2 Update form submission

  - Include maxWinners in prize form data
  - Set currentWinners to 0 for new prizes
  - Generate unique prize ID when creating new prize
  - Update API route to handle new fields
  - Ensure backward compatibility with existing prizes
  - _Requirements: 6_

- [x] 9.3 Update event creation/edit pages

  - Update EventForm or EventCreateClient to pass maxWinners
  - Update form validation to include maxWinners
  - Update API routes to accept and store new fields
  - Test form submission with new fields
  - _Requirements: 6_

- [x] 10. Create Data Migration Script

  - Create migration script to add IDs to existing prizes
  - Add maxWinners and currentWinners defaults to existing prizes
  - Test migration on development data
  - Document migration process
  - Create rollback plan
  - _Requirements: 4, 6_

- [x] 10.1 Create migration script

  - Create `scripts/migrate-prizes.ts` file
  - Fetch all events using eventService.getAll()
  - For each event, update prizes array with new fields
  - Generate unique IDs for prizes (e.g., `prize_${eventId}_${index}`)
  - Set maxWinners: 1 and currentWinners: 0 as defaults
  - Use eventService.update to save changes
  - _Requirements: 4, 6_

- [x] 10.2 Test migration script

  - Run migration on development environment
  - Verify all prizes have id, maxWinners, currentWinners fields
  - Check that existing prize data is preserved
  - Test that application works with migrated data
  - Document any issues encountered
  - _Requirements: 4, 6_

- [x] 10.3 Document migration process

  - Add migration instructions to README or docs
  - Document prerequisites and backup steps
  - Create rollback procedure if migration fails
  - Add verification steps to confirm success
  - Include troubleshooting section
  - _Requirements: 4, 6_

- [-] 11. Update Seed Data Scripts

  - Update seed-aws-data.js to include prize IDs and maxWinners
  - Add sample prize awards to seed data
  - Create diverse examples (single winner, multiple winners)
  - Ensure seed data demonstrates all features
  - Update both AWS and local seed scripts
  - _Requirements: 1, 2, 3, 6, 7_

- [x] 11.1 Update prize seed data

  - Add id field to all prize objects in seed data
  - Add maxWinners field with varied values (1, 2, 3, 5)
  - Add currentWinners field (will be updated when awards created)
  - Update both seed-aws-data.js and seed-local-data.js
  - Ensure prize IDs are unique within each event
  - _Requirements: 6_

- [x] 11.2 Add prize award seed data

  - Create sample prize awards linking projects to prizes
  - Include examples of single-winner prizes
  - Include examples of multiple winners for same prize
  - Ensure some projects have multiple prizes
  - Leave some projects without prizes for filtering demo
  - Use prizeAwardService.create() to add awards
  - _Requirements: 1, 2, 3, 7_

- [x] 11.3 Test seed data

  - Run seed scripts on clean database
  - Verify all prizes have correct fields
  - Verify prize awards are created correctly
  - Test that UI displays seeded data properly
  - Check that filtering and sorting work with seed data
  - _Requirements: 1, 2, 3, 6, 7_

- [ ]\* 12. Testing and Validation

  - Write unit tests for prize utilities
  - Write integration tests for PrizeAwardService
  - Create E2E tests for prize display and filtering
  - Test prize winner prioritization
  - Validate DynamoDB query patterns
  - Test backward compatibility
  - _Requirements: 1, 2, 3, 4, 7_

- [ ]\* 12.1 Unit tests for utilities

  - Test calculatePrizeStatus with projects with/without prizes
  - Test sortProjectsByPrizeStatus with mixed project arrays
  - Test filterProjectsByPrizeStatus with all filter options
  - Achieve 100% code coverage for utility functions
  - _Requirements: 2, 3, 7_

- [ ]\* 12.2 Integration tests for PrizeAwardService

  - Test create method with valid and invalid data
  - Test getByProject, getByPrize, getByEvent methods
  - Test remove method and currentWinners update
  - Test canAwardPrize validation logic
  - Test duplicate award prevention
  - Test prize capacity validation
  - _Requirements: 4_

- [ ]\* 12.3 Integration tests for DynamoDB adapter

  - Test parseKey for prize-award pattern
  - Test generateGSIKeys for prize awards
  - Test getAll with prize-award prefixes
  - Test buildKey for prize-award items
  - Verify GSI queries work correctly
  - _Requirements: 4_

- [ ]\* 12.4 E2E tests for UI features

  - Test prize display on project detail page
  - Test prize indicators on project cards
  - Test prize status filtering functionality
  - Test prize winner prioritization on event pages
  - Test prize configuration in event form
  - Test responsive design on mobile devices
  - _Requirements: 1, 2, 3, 6, 7_

- [ ]\* 12.5 Backward compatibility tests
  - Test that projects without prizeAwards field still work
  - Test that prizes without id/maxWinners still display
  - Test that existing API routes remain functional
  - Verify no breaking changes to existing features
  - _Requirements: 1, 2, 3, 4, 6, 7_
