#!/usr/bin/env node

/**
 * Seed script for AWS DynamoDB
 * Populates the AWS DynamoDB table with sample events and projects
 *
 * Usage:
 *   node scripts/seed-aws-data.js [table-name] [region]
 *
 * Examples:
 *   node scripts/seed-aws-data.js hackagallery-dev us-west-2
 *   node scripts/seed-aws-data.js hackagallery-prod us-west-2
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Get table name and region from command line args or environment variables
const TABLE_NAME =
  process.argv[2] || process.env.DYNAMODB_TABLE_NAME || "hackagallery-dev";
const REGION = process.argv[3] || process.env.AWS_REGION || "us-west-2";

// Create DynamoDB client (uses AWS credentials from environment or AWS CLI config)
const client = new DynamoDBClient({
  region: REGION,
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

// Sample data
const sampleEvents = [
  {
    PK: "EVENT#evt_001",
    SK: "METADATA",
    GSI1PK: "ORGANIZER#user_org_001",
    GSI1SK: "EVENT#evt_001",
    entityType: "Event",
    id: "evt_001",
    name: "HackMIT 2024",
    description:
      "Annual hackathon at MIT featuring cutting-edge technology challenges",
    startDate: "2024-09-15T09:00:00Z",
    endDate: "2024-09-17T18:00:00Z",
    location: "MIT Campus, Cambridge, MA",
    prizes: [
      {
        title: "First Place",
        amount: "$10,000",
        description: "Best overall project",
      },
      {
        title: "Best AI Project",
        amount: "$5,000",
        description: "Most innovative use of AI/ML",
      },
    ],
    requirements: "Must be a current student with valid student ID",
    organizerId: "user_org_001",
    organizerName: "MIT Hacking Club",
    isHidden: false,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    PK: "EVENT#evt_002",
    SK: "METADATA",
    GSI1PK: "ORGANIZER#user_org_002",
    GSI1SK: "EVENT#evt_002",
    entityType: "Event",
    id: "evt_002",
    name: "Stanford TreeHacks 2024",
    description: "Build projects that make a positive impact on the world",
    startDate: "2024-10-20T08:00:00Z",
    endDate: "2024-10-22T20:00:00Z",
    location: "Stanford University, Palo Alto, CA",
    prizes: [
      {
        title: "Grand Prize",
        amount: "$15,000",
        description: "Best overall hack",
      },
    ],
    requirements: "Open to all university students",
    organizerId: "user_org_002",
    organizerName: "Stanford ACM",
    isHidden: false,
    createdAt: "2024-02-01T14:30:00Z",
    updatedAt: "2024-02-01T14:30:00Z",
  },
];

const sampleProjects = [
  {
    PK: "EVENT#evt_001",
    SK: "PROJECT#proj_001",
    GSI1PK: "HACKER#user_hacker_001",
    GSI1SK: "PROJECT#proj_001",
    entityType: "Project",
    id: "proj_001",
    eventId: "evt_001",
    name: "AI Study Buddy",
    description:
      "An AI-powered study assistant that helps students learn more effectively using personalized learning paths",
    githubUrl: "https://github.com/team/ai-study-buddy",
    demoUrl: "https://ai-study-buddy.demo.com",
    technologies: ["React", "Python", "OpenAI", "FastAPI"],
    teamMembers: [
      {
        name: "Alice Johnson",
        role: "Full Stack Developer",
        githubUsername: "alicejohnson",
        userId: "user_hacker_001",
      },
      {
        name: "Bob Smith",
        role: "ML Engineer",
        githubUsername: "bobsmith",
      },
    ],
    hackerId: "user_hacker_001",
    isHidden: false,
    createdAt: "2024-09-16T14:30:00Z",
    updatedAt: "2024-09-16T14:30:00Z",
  },
  {
    PK: "EVENT#evt_001",
    SK: "PROJECT#proj_002",
    GSI1PK: "HACKER#user_hacker_002",
    GSI1SK: "PROJECT#proj_002",
    entityType: "Project",
    id: "proj_002",
    eventId: "evt_001",
    name: "EcoTrack",
    description:
      "Mobile app for tracking personal carbon footprint and suggesting eco-friendly alternatives",
    githubUrl: "https://github.com/team/ecotrack",
    demoUrl: "https://ecotrack.demo.com",
    technologies: ["React Native", "Node.js", "MongoDB", "Google Maps API"],
    teamMembers: [
      {
        name: "Charlie Davis",
        role: "Mobile Developer",
        githubUsername: "charliedavis",
        userId: "user_hacker_002",
      },
    ],
    hackerId: "user_hacker_002",
    isHidden: false,
    createdAt: "2024-09-16T16:45:00Z",
    updatedAt: "2024-09-16T16:45:00Z",
  },
  {
    PK: "EVENT#evt_002",
    SK: "PROJECT#proj_003",
    GSI1PK: "HACKER#user_hacker_003",
    GSI1SK: "PROJECT#proj_003",
    entityType: "Project",
    id: "proj_003",
    eventId: "evt_002",
    name: "HealthHub",
    description:
      "Platform connecting patients with healthcare resources and telemedicine services",
    githubUrl: "https://github.com/team/healthhub",
    demoUrl: "https://healthhub.demo.com",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "WebRTC"],
    teamMembers: [
      {
        name: "Diana Martinez",
        role: "Frontend Developer",
        githubUsername: "dianamartinez",
        userId: "user_hacker_003",
      },
      {
        name: "Ethan Brown",
        role: "Backend Developer",
        githubUsername: "ethanbrown",
      },
    ],
    hackerId: "user_hacker_003",
    isHidden: false,
    createdAt: "2024-10-21T11:20:00Z",
    updatedAt: "2024-10-21T11:20:00Z",
  },
];

async function seedData() {
  console.log("=".repeat(60));
  console.log("Seeding AWS DynamoDB with Sample Data");
  console.log("=".repeat(60));
  console.log("");
  console.log("Configuration:");
  console.log(`  - Table: ${TABLE_NAME}`);
  console.log(`  - Region: ${REGION}`);
  console.log("");

  try {
    // Seed events
    console.log(`Seeding ${sampleEvents.length} events...`);
    for (const event of sampleEvents) {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: event,
        })
      );
      console.log(`  ✓ Created event: ${event.name}`);
    }

    console.log("");

    // Seed projects
    console.log(`Seeding ${sampleProjects.length} projects...`);
    for (const project of sampleProjects) {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: project,
        })
      );
      console.log(`  ✓ Created project: ${project.name}`);
    }

    console.log("");
    console.log("=".repeat(60));
    console.log("Seeding Complete!");
    console.log("=".repeat(60));
    console.log("");
    console.log("Sample data created:");
    console.log(`  - ${sampleEvents.length} events`);
    console.log(`  - ${sampleProjects.length} projects`);
    console.log("");
    console.log("You can now query your table:");
    console.log(
      `  aws dynamodb scan --table-name ${TABLE_NAME} --region ${REGION}`
    );
    console.log("");
  } catch (error) {
    console.error("✗ Failed to seed data:", error.message);
    console.error("");

    if (error.name === "ResourceNotFoundException") {
      console.error("Table not found. Please verify:");
      console.error(`  1. Table "${TABLE_NAME}" exists in region ${REGION}`);
      console.error("  2. You have the correct AWS credentials configured");
    } else if (error.name === "AccessDeniedException") {
      console.error("Access denied. Please verify:");
      console.error("  1. Your AWS credentials are configured correctly");
      console.error("  2. Your IAM user/role has DynamoDB PutItem permissions");
      console.error("");
      console.error("Required IAM permissions:");
      console.error("  - dynamodb:PutItem");
    } else {
      console.error("Error details:", error);
    }

    process.exit(1);
  }
}

// Run seeding
seedData().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
