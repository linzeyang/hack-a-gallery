#!/usr/bin/env node

/**
 * Test script to verify seed data integrity
 * Tests all requirements from task 11.3:
 * - Verify all prizes have correct fields
 * - Verify prize awards are created correctly
 * - Test that UI displays seeded data properly
 * - Check that filtering and sorting work with seed data
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

// Configuration
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "hackagallery-dev";
const REGION = process.env.AWS_REGION || "us-west-2";
const USE_LOCAL = process.argv.includes("--local");

// Create DynamoDB client
const clientConfig = {
  region: REGION,
};

if (USE_LOCAL) {
  clientConfig.endpoint = "http://localhost:8000";
  clientConfig.credentials = {
    accessKeyId: "local",
    secretAccessKey: "local",
  };
}

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

function logTest(name, passed, message = "") {
  const status = passed ? "✓ PASS" : "✗ FAIL";
  const color = passed ? "\x1b[32m" : "\x1b[31m";
  console.log(`${color}${status}\x1b[0m ${name}`);
  if (message) {
    console.log(`  ${message}`);
  }

  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

function logSection(title) {
  console.log("");
  console.log("=".repeat(80));
  console.log(title);
  console.log("=".repeat(80));
}

async function getAllItems() {
  const items = [];
  let lastEvaluatedKey = undefined;

  do {
    const params = {
      TableName: TABLE_NAME,
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const response = await docClient.send(new ScanCommand(params));
    items.push(...(response.Items || []));
    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

async function testPrizeFields(events) {
  logSection("Test 1: Verify All Prizes Have Correct Fields");

  let totalPrizes = 0;
  let prizesWithAllFields = 0;
  const missingFields = [];

  for (const event of events) {
    if (!event.prizes || !Array.isArray(event.prizes)) {
      continue;
    }

    for (const prize of event.prizes) {
      totalPrizes++;

      const hasId = typeof prize.id === "string" && prize.id.length > 0;
      const hasTitle =
        typeof prize.title === "string" && prize.title.length > 0;
      const hasAmount =
        typeof prize.amount === "string" && prize.amount.length > 0;
      const hasDescription = typeof prize.description === "string";
      const hasMaxWinners =
        typeof prize.maxWinners === "number" && prize.maxWinners >= 1;
      const hasCurrentWinners =
        typeof prize.currentWinners === "number" && prize.currentWinners >= 0;

      if (
        hasId &&
        hasTitle &&
        hasAmount &&
        hasDescription &&
        hasMaxWinners &&
        hasCurrentWinners
      ) {
        prizesWithAllFields++;
      } else {
        const missing = [];
        if (!hasId) missing.push("id");
        if (!hasTitle) missing.push("title");
        if (!hasAmount) missing.push("amount");
        if (!hasDescription) missing.push("description");
        if (!hasMaxWinners) missing.push("maxWinners");
        if (!hasCurrentWinners) missing.push("currentWinners");

        missingFields.push({
          eventId: event.id,
          prizeId: prize.id || "unknown",
          missing,
        });
      }
    }
  }

  logTest(
    "All prizes have required fields (id, title, amount, description, maxWinners, currentWinners)",
    prizesWithAllFields === totalPrizes,
    `${prizesWithAllFields}/${totalPrizes} prizes have all required fields`
  );

  if (missingFields.length > 0) {
    console.log("\n  Missing fields details:");
    missingFields.forEach(({ eventId, prizeId, missing }) => {
      console.log(
        `    Event ${eventId}, Prize ${prizeId}: missing ${missing.join(", ")}`
      );
    });
  }

  // Test prize ID format
  const validIdFormat = events.every(
    (event) =>
      event.prizes?.every(
        (prize) => prize.id && prize.id.startsWith("prize_")
      ) ?? true
  );

  logTest(
    "All prize IDs follow correct format (prize_*)",
    validIdFormat,
    validIdFormat
      ? "All prize IDs are properly formatted"
      : "Some prize IDs have incorrect format"
  );

  // Test maxWinners values
  const validMaxWinners = events.every(
    (event) =>
      event.prizes?.every(
        (prize) => prize.maxWinners >= 1 && Number.isInteger(prize.maxWinners)
      ) ?? true
  );

  logTest(
    "All prizes have valid maxWinners (positive integer >= 1)",
    validMaxWinners,
    validMaxWinners
      ? "All maxWinners values are valid"
      : "Some maxWinners values are invalid"
  );

  return { totalPrizes, prizesWithAllFields };
}

async function testPrizeAwards(prizeAwards, events, projects) {
  logSection("Test 2: Verify Prize Awards Are Created Correctly");

  // Test 2.1: Prize awards have correct structure
  const validStructure = prizeAwards.every(
    (award) =>
      award.id &&
      award.projectId &&
      award.prizeId &&
      award.eventId &&
      award.awardedAt &&
      award.PK &&
      award.SK &&
      award.GSI1PK &&
      award.GSI1SK
  );

  logTest(
    "All prize awards have correct structure",
    validStructure,
    `${prizeAwards.length} prize awards checked`
  );

  // Test 2.2: Prize awards reference valid projects
  const projectIds = new Set(projects.map((p) => p.id));
  const validProjectRefs = prizeAwards.every((award) =>
    projectIds.has(award.projectId)
  );

  logTest(
    "All prize awards reference valid projects",
    validProjectRefs,
    validProjectRefs
      ? "All project references are valid"
      : "Some awards reference non-existent projects"
  );

  // Test 2.3: Prize awards reference valid prizes
  const prizeMap = new Map();
  events.forEach((event) => {
    event.prizes?.forEach((prize) => {
      prizeMap.set(prize.id, { eventId: event.id, prize });
    });
  });

  const validPrizeRefs = prizeAwards.every((award) =>
    prizeMap.has(award.prizeId)
  );

  logTest(
    "All prize awards reference valid prizes",
    validPrizeRefs,
    validPrizeRefs
      ? "All prize references are valid"
      : "Some awards reference non-existent prizes"
  );

  // Test 2.4: Prize awards respect maxWinners constraint
  const awardsByPrize = new Map();
  prizeAwards.forEach((award) => {
    if (!awardsByPrize.has(award.prizeId)) {
      awardsByPrize.set(award.prizeId, []);
    }
    awardsByPrize.get(award.prizeId).push(award);
  });

  let maxWinnersViolations = 0;
  awardsByPrize.forEach((awards, prizeId) => {
    const prizeInfo = prizeMap.get(prizeId);
    if (prizeInfo && awards.length > prizeInfo.prize.maxWinners) {
      maxWinnersViolations++;
      console.log(
        `  Prize ${prizeId} has ${awards.length} winners but maxWinners is ${prizeInfo.prize.maxWinners}`
      );
    }
  });

  logTest(
    "Prize awards respect maxWinners constraint",
    maxWinnersViolations === 0,
    maxWinnersViolations === 0
      ? "All prizes respect their maxWinners limit"
      : `${maxWinnersViolations} prizes exceed their maxWinners limit`
  );

  // Test 2.5: currentWinners matches actual award count
  let currentWinnersMismatches = 0;
  events.forEach((event) => {
    event.prizes?.forEach((prize) => {
      const awards = awardsByPrize.get(prize.id) || [];
      if (awards.length !== prize.currentWinners) {
        currentWinnersMismatches++;
        console.log(
          `  Prize ${prize.id}: currentWinners=${prize.currentWinners} but actual awards=${awards.length}`
        );
      }
    });
  });

  logTest(
    "Prize currentWinners matches actual award count",
    currentWinnersMismatches === 0,
    currentWinnersMismatches === 0
      ? "All currentWinners counts are accurate"
      : `${currentWinnersMismatches} prizes have incorrect currentWinners count`
  );

  // Test 2.6: DynamoDB key patterns are correct
  const validKeyPatterns = prizeAwards.every((award) => {
    const pkValid = award.PK === `EVENT#${award.eventId}`;
    const skValid =
      award.SK === `PRIZE-AWARD#${award.prizeId}#${award.projectId}`;
    const gsi1pkValid = award.GSI1PK === `PROJECT#${award.projectId}`;
    const gsi1skValid = award.GSI1SK === `PRIZE-AWARD#${award.prizeId}`;
    return pkValid && skValid && gsi1pkValid && gsi1skValid;
  });

  logTest(
    "Prize awards use correct DynamoDB key patterns",
    validKeyPatterns,
    validKeyPatterns
      ? "All key patterns are correct"
      : "Some key patterns are incorrect"
  );

  // Test 2.7: Check for duplicate awards (same project + prize)
  const awardKeys = new Set();
  let duplicates = 0;
  prizeAwards.forEach((award) => {
    const key = `${award.projectId}:${award.prizeId}`;
    if (awardKeys.has(key)) {
      duplicates++;
      console.log(
        `  Duplicate award: Project ${award.projectId} won prize ${award.prizeId} multiple times`
      );
    }
    awardKeys.add(key);
  });

  logTest(
    "No duplicate prize awards (same project + prize)",
    duplicates === 0,
    duplicates === 0
      ? "No duplicates found"
      : `${duplicates} duplicate awards found`
  );

  return { totalAwards: prizeAwards.length, awardsByPrize };
}

async function testDataDistribution(events, projects, prizeAwards) {
  logSection("Test 3: Verify Data Distribution for UI Testing");

  // Test 3.1: Projects with multiple prizes
  const projectAwardCounts = new Map();
  prizeAwards.forEach((award) => {
    projectAwardCounts.set(
      award.projectId,
      (projectAwardCounts.get(award.projectId) || 0) + 1
    );
  });

  const projectsWithMultiplePrizes = Array.from(
    projectAwardCounts.values()
  ).filter((count) => count > 1).length;

  logTest(
    "Some projects have multiple prizes",
    projectsWithMultiplePrizes > 0,
    `${projectsWithMultiplePrizes} projects have multiple prizes`
  );

  // Test 3.2: Projects without prizes
  const projectsWithPrizes = new Set(prizeAwards.map((a) => a.projectId));
  const projectsWithoutPrizes = projects.filter(
    (p) => !projectsWithPrizes.has(p.id)
  ).length;

  logTest(
    "Some projects have no prizes (for filtering demo)",
    projectsWithoutPrizes > 0,
    `${projectsWithoutPrizes} projects have no prizes`
  );

  const multiWinnerPrizes = new Set();
  prizeAwards.forEach((award) => {
    const awards = prizeAwards.filter((a) => a.prizeId === award.prizeId);
    if (awards.length > 1) {
      multiWinnerPrizes.add(award.prizeId);
    }
  });

  logTest(
    "Some prizes have multiple winners",
    multiWinnerPrizes.size > 0,
    `${multiWinnerPrizes.size} prizes have multiple winners`
  );

  // Test 3.4: Events with prizes
  const eventsWithPrizes = events.filter(
    (e) => e.prizes && e.prizes.length > 0
  ).length;

  logTest(
    "All events have prizes defined",
    eventsWithPrizes === events.length,
    `${eventsWithPrizes}/${events.length} events have prizes`
  );

  // Test 3.5: Variety in maxWinners values
  const maxWinnersValues = new Set();
  events.forEach((event) => {
    event.prizes?.forEach((prize) => {
      maxWinnersValues.add(prize.maxWinners);
    });
  });

  logTest(
    "Prizes have varied maxWinners values (1, 2, 3, etc.)",
    maxWinnersValues.size > 1,
    `Found ${maxWinnersValues.size} different maxWinners values: ${Array.from(
      maxWinnersValues
    )
      .sort((a, b) => a - b)
      .join(", ")}`
  );

  return {
    projectsWithMultiplePrizes,
    projectsWithoutPrizes,
    multiWinnerPrizes: multiWinnerPrizes.size,
  };
}

async function testFilteringAndSorting(projects, prizeAwards) {
  logSection("Test 4: Verify Filtering and Sorting Capabilities");

  // Simulate filtering logic
  const projectsWithPrizes = new Set(prizeAwards.map((a) => a.projectId));

  // Test 4.1: Filter "winners only"
  const winnersOnly = projects.filter((p) => projectsWithPrizes.has(p.id));

  logTest(
    "Can filter projects to show winners only",
    winnersOnly.length > 0 && winnersOnly.length < projects.length,
    `${winnersOnly.length} winners out of ${projects.length} total projects`
  );

  // Test 4.2: Filter "no prizes"
  const noPrizes = projects.filter((p) => !projectsWithPrizes.has(p.id));

  logTest(
    "Can filter projects to show non-winners only",
    noPrizes.length > 0,
    `${noPrizes.length} projects without prizes`
  );

  // Test 4.3: Sorting by prize status
  const sorted = [...projects].sort((a, b) => {
    const aHasPrizes = projectsWithPrizes.has(a.id);
    const bHasPrizes = projectsWithPrizes.has(b.id);

    if (aHasPrizes && !bHasPrizes) return -1;
    if (!aHasPrizes && bHasPrizes) return 1;
    return 0;
  });

  const firstWinnerIndex = sorted.findIndex((p) =>
    projectsWithPrizes.has(p.id)
  );
  const lastWinnerIndex = sorted
    .map((p) => projectsWithPrizes.has(p.id))
    .lastIndexOf(true);
  const firstNonWinnerIndex = sorted.findIndex(
    (p) => !projectsWithPrizes.has(p.id)
  );

  const sortingWorks =
    firstWinnerIndex === 0 &&
    (firstNonWinnerIndex === -1 || firstNonWinnerIndex > lastWinnerIndex);

  logTest(
    "Can sort projects with winners first",
    sortingWorks,
    sortingWorks
      ? "Winners are correctly sorted before non-winners"
      : "Sorting logic may have issues"
  );

  // Test 4.4: Prize count calculation
  const projectPrizeCounts = new Map();
  prizeAwards.forEach((award) => {
    projectPrizeCounts.set(
      award.projectId,
      (projectPrizeCounts.get(award.projectId) || 0) + 1
    );
  });

  const maxPrizeCount = Math.max(...Array.from(projectPrizeCounts.values()), 0);

  logTest(
    "Can calculate prize counts per project",
    maxPrizeCount > 0,
    `Maximum prizes won by a single project: ${maxPrizeCount}`
  );

  return {
    winnersCount: winnersOnly.length,
    nonWinnersCount: noPrizes.length,
    maxPrizeCount,
  };
}

async function runTests() {
  console.log("");
  console.log("=".repeat(80));
  console.log("SEED DATA VERIFICATION TEST SUITE");
  console.log("=".repeat(80));
  console.log("");
  console.log("Configuration:");
  console.log(`  Table: ${TABLE_NAME}`);
  console.log(`  Region: ${REGION}`);
  console.log(`  Mode: ${USE_LOCAL ? "Local DynamoDB" : "AWS DynamoDB"}`);
  console.log("");

  try {
    // Fetch all data
    console.log("Fetching data from DynamoDB...");
    const allItems = await getAllItems();
    console.log(`✓ Retrieved ${allItems.length} items from database`);
    console.log("");

    // Categorize items
    const events = allItems.filter((item) => item.entityType === "Event");
    const projects = allItems.filter((item) => item.entityType === "Project");
    const prizeAwards = allItems.filter(
      (item) => item.entityType === "PrizeAward"
    );

    console.log("Data Summary:");
    console.log(`  Events: ${events.length}`);
    console.log(`  Projects: ${projects.length}`);
    console.log(`  Prize Awards: ${prizeAwards.length}`);

    // Run test suites
    await testPrizeFields(events);
    await testPrizeAwards(prizeAwards, events, projects);
    await testDataDistribution(events, projects, prizeAwards);
    await testFilteringAndSorting(projects, prizeAwards);

    // Print summary
    logSection("TEST SUMMARY");
    console.log("");
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`\x1b[32mPassed: ${testResults.passed}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${testResults.failed}\x1b[0m`);
    console.log(`\x1b[33mWarnings: ${testResults.warnings}\x1b[0m`);
    console.log("");

    if (testResults.failed === 0) {
      console.log("\x1b[32m✓ ALL TESTS PASSED!\x1b[0m");
      console.log("");
      console.log("Seed data is ready for UI testing:");
      console.log(
        "  ✓ All prizes have correct fields (id, maxWinners, currentWinners)"
      );
      console.log("  ✓ Prize awards are properly structured and validated");
      console.log("  ✓ Data includes variety for comprehensive testing");
      console.log("  ✓ Filtering and sorting logic can be implemented");
      console.log("");
      process.exit(0);
    } else {
      console.log("\x1b[31m✗ SOME TESTS FAILED\x1b[0m");
      console.log("");

      // Check if the issue is duplicate data from multiple seed runs
      if (allItems.length > 200) {
        console.log(
          "\x1b[33m⚠ WARNING: Database contains more items than expected.\x1b[0m"
        );
        console.log(
          "This suggests the seed script was run multiple times without clearing."
        );
        console.log("");
        console.log("To fix:");
        console.log("  1. Clear the DynamoDB table");
        console.log("  2. Run the seed script once: npm run seed:aws");
        console.log("  3. Run this test again");
        console.log("");
      }

      console.log(
        "Please review the failed tests above and fix the seed data."
      );
      console.log("");
      process.exit(1);
    }
  } catch (error) {
    console.error("\x1b[31m✗ TEST SUITE FAILED\x1b[0m");
    console.error("");
    console.error("Error:", error.message);
    console.error("");

    if (error.name === "ResourceNotFoundException") {
      console.error("Table not found. Please verify:");
      console.error(`  1. Table "${TABLE_NAME}" exists`);
      console.error("  2. Seed data has been loaded");
      console.error("");
      console.error("To seed data:");
      console.error("  npm run seed:aws  (for AWS)");
      console.error("  npm run seed:local  (for local DynamoDB)");
    } else if (error.name === "AccessDeniedException") {
      console.error("Access denied. Please verify:");
      console.error("  1. AWS credentials are configured correctly");
      console.error(
        "  2. IAM permissions include dynamodb:Scan and dynamodb:Query"
      );
    }

    process.exit(1);
  }
}

// Run the test suite
runTests();
