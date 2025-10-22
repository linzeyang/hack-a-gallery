#!/usr/bin/env node

/**
 * Comprehensive Seed script for AWS DynamoDB
 * Populates the AWS DynamoDB table with extensive sample events and projects
 * Includes 10 past events, 1 ongoing event, 5 future events, and 80+ projects
 *
 * Usage:
 *   node scripts/seed-aws-data-comprehensive.js [table-name] [region]
 *
 * Examples:
 *   node scripts/seed-aws-data-comprehensive.js hackagallery-dev us-west-2
 *   node scripts/seed-aws-data-comprehensive.js hackagallery-prod us-west-2
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

function generatePastDate(daysAgo) {
  const now = new Date();
  return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

function generateFutureDate(daysFromNow) {
  const now = new Date();
  return new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
}

// Mock data arrays
const organizers = [
  "TechCorp Innovations",
  "AI Research Labs",
  "Future Tech Foundation",
  "Digital Innovation Hub",
  "CodeCraft Academy",
  "NextGen Solutions",
  "Quantum Labs",
  "DataSphere Inc",
  "CloudTech Ventures",
  "InnovateTech Group",
];

const hackerNames = [
  "Alex Chen",
  "Sarah Johnson",
  "Michael Rodriguez",
  "Emily Davis",
  "David Kim",
  "Jessica Wang",
  "Ryan Thompson",
  "Maria Garcia",
  "James Wilson",
  "Lisa Zhang",
  "Kevin Patel",
  "Amanda Brown",
  "Daniel Lee",
  "Rachel Martinez",
  "Chris Taylor",
  "Sophia Anderson",
  "Matthew Singh",
  "Nicole White",
  "Brandon Liu",
  "Ashley Kumar",
  "Jordan Smith",
  "Megan Jones",
  "Tyler Williams",
  "Samantha Miller",
  "Austin Chang",
  "Hannah Davis",
  "Nathan Park",
  "Olivia Johnson",
  "Ethan Rodriguez",
  "Grace Lee",
];

const technologies = [
  "React",
  "Node.js",
  "Python",
  "TensorFlow",
  "PyTorch",
  "JavaScript",
  "TypeScript",
  "MongoDB",
  "PostgreSQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "Flutter",
  "Swift",
  "Java",
  "C++",
  "Go",
  "Rust",
  "Vue.js",
  "Angular",
  "Express.js",
  "FastAPI",
  "GraphQL",
  "Redis",
  "Elasticsearch",
  "Firebase",
  "Supabase",
  "Vercel",
  "Netlify",
];

// Generate comprehensive sample events
const sampleEvents = [];

// 10 Past Events
const pastEventNames = [
  "AI Innovation Challenge 2023",
  "HealthTech Hackathon",
  "FinTech Revolution",
  "Climate Change Solutions",
  "EdTech Future Summit",
  "Smart City Challenge",
  "Blockchain Builders",
  "IoT Innovation Lab",
  "Cybersecurity Shield",
  "Gaming Revolution Hack",
];

pastEventNames.forEach((name, index) => {
  const eventId = `evt_${String(index + 100).padStart(3, "0")}`;
  const organizerId = `user_org_${String(index + 100).padStart(3, "0")}`;
  const startDate = generatePastDate(365 - index * 30);
  const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

  sampleEvents.push({
    PK: `EVENT#${eventId}`,
    SK: "METADATA",
    GSI1PK: `ORGANIZER#${organizerId}`,
    GSI1SK: `EVENT#${eventId}`,
    entityType: "Event",
    id: eventId,
    name,
    description: `A cutting-edge hackathon focused on ${name.toLowerCase()} with innovative solutions and breakthrough technologies.`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    location: [
      "San Francisco, CA",
      "New York, NY",
      "Austin, TX",
      "Seattle, WA",
      "Boston, MA",
    ][index % 5],
    prizes: [
      {
        id: `prize_${eventId}_0`,
        title: "First Place",
        amount: "$10,000",
        description: "Best overall project",
        maxWinners: 1,
        currentWinners: 0,
      },
      {
        id: `prize_${eventId}_1`,
        title: "Second Place",
        amount: "$5,000",
        description: "Runner-up project",
        maxWinners: 1,
        currentWinners: 0,
      },
      {
        id: `prize_${eventId}_2`,
        title: "Third Place",
        amount: "$2,500",
        description: "Third place project",
        maxWinners: 2,
        currentWinners: 0,
      },
    ],
    requirements: "Open to all developers and students",
    organizerId,
    organizerName: organizers[index % organizers.length],
    isHidden: false,
    createdAt: generatePastDate(400 - index * 30).toISOString(),
    updatedAt: endDate.toISOString(),
  });
});

// 1 Ongoing Event
const ongoingStartDate = generatePastDate(1);
const ongoingEndDate = generateFutureDate(2);
const ongoingEventId = "evt_110";
const ongoingOrganizerId = "user_org_110";

sampleEvents.push({
  PK: `EVENT#${ongoingEventId}`,
  SK: "METADATA",
  GSI1PK: `ORGANIZER#${ongoingOrganizerId}`,
  GSI1SK: `EVENT#${ongoingEventId}`,
  entityType: "Event",
  id: ongoingEventId,
  name: "Open Source AI Models Hackathon",
  description:
    "Build innovative applications using open-source AI models and push the boundaries of what's possible with accessible AI technology.",
  startDate: ongoingStartDate.toISOString(),
  endDate: ongoingEndDate.toISOString(),
  location: "Virtual & San Francisco, CA",
  prizes: [
    {
      id: `prize_${ongoingEventId}_0`,
      title: "Grand Prize",
      amount: "$25,000",
      description: "Best overall innovation",
      maxWinners: 1,
      currentWinners: 0,
    },
    {
      id: `prize_${ongoingEventId}_1`,
      title: "AI Innovation Award",
      amount: "$15,000",
      description: "Most creative AI implementation",
      maxWinners: 3,
      currentWinners: 0,
    },
    {
      id: `prize_${ongoingEventId}_2`,
      title: "Social Impact Award",
      amount: "$10,000",
      description: "Best project for social good",
      maxWinners: 2,
      currentWinners: 0,
    },
  ],
  requirements: "Open to all developers worldwide",
  organizerId: ongoingOrganizerId,
  organizerName: "AI Research Labs",
  isHidden: false,
  createdAt: generatePastDate(30).toISOString(),
  updatedAt: new Date().toISOString(),
});

// 5 Future Events
const futureEventNames = [
  "Quantum Computing Challenge",
  "Sustainable Tech Summit",
  "Web3 Innovation Lab",
  "Robotics & Automation Hack",
  "Space Tech Pioneer Challenge",
];

futureEventNames.forEach((name, index) => {
  const eventId = `evt_${String(index + 120).padStart(3, "0")}`;
  const organizerId = `user_org_${String(index + 120).padStart(3, "0")}`;
  const startDate = generateFutureDate(30 + index * 45);
  const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

  sampleEvents.push({
    PK: `EVENT#${eventId}`,
    SK: "METADATA",
    GSI1PK: `ORGANIZER#${organizerId}`,
    GSI1SK: `EVENT#${eventId}`,
    entityType: "Event",
    id: eventId,
    name,
    description: `An upcoming hackathon exploring ${name.toLowerCase()} with focus on innovation and real-world applications.`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    location: [
      "Los Angeles, CA",
      "Chicago, IL",
      "Miami, FL",
      "Denver, CO",
      "Portland, OR",
    ][index % 5],
    prizes: [
      {
        id: `prize_${eventId}_0`,
        title: "Winner",
        amount: "$15,000",
        description: "Best overall hack",
        maxWinners: 1,
        currentWinners: 0,
      },
      {
        id: `prize_${eventId}_1`,
        title: "Runner-up",
        amount: "$8,000",
        description: "Second place",
        maxWinners: 1,
        currentWinners: 0,
      },
      {
        id: `prize_${eventId}_2`,
        title: "Third Place",
        amount: "$4,000",
        description: "Third place",
        maxWinners: 3,
        currentWinners: 0,
      },
    ],
    requirements: "Open to students and professionals",
    organizerId,
    organizerName: organizers[(index + 5) % organizers.length],
    isHidden: false,
    createdAt: generatePastDate(60 - index * 10).toISOString(),
    updatedAt: generatePastDate(5).toISOString(),
  });
});

// Generate comprehensive sample projects
const sampleProjects = [];

// Project templates inspired by scraped DevPost data
const projectTemplates = [
  {
    nameTemplate: "ChefBot",
    descriptionTemplate:
      "An AI-powered kitchen assistant that helps users cook meals with step-by-step guidance and recipe recommendations.",
    category: "AI/ML",
  },
  {
    nameTemplate: "MindfulAI",
    descriptionTemplate:
      "A privacy-first mental wellness application that provides emotional support and mindfulness exercises.",
    category: "Healthcare",
  },
  {
    nameTemplate: "StudyMate",
    descriptionTemplate:
      "An offline AI study assistant that converts documents into interactive flashcards and quizzes.",
    category: "Education",
  },
  {
    nameTemplate: "BrainScope",
    descriptionTemplate:
      "A visualization tool that shows AI model thinking processes in real-time for better understanding.",
    category: "Developer Tools",
  },
  {
    nameTemplate: "IdeaCompass",
    descriptionTemplate:
      "An AI brainstorming partner that transforms single concepts into comprehensive project ideas.",
    category: "Productivity",
  },
  {
    nameTemplate: "WellnessTracker",
    descriptionTemplate:
      "A personalized health and finance buddy that provides actionable insights and forecasts.",
    category: "Lifestyle",
  },
  {
    nameTemplate: "PainRelief AI",
    descriptionTemplate:
      "An accessible AI-guided support system for chronic pain management and therapy.",
    category: "Healthcare",
  },
  {
    nameTemplate: "FinanceBot",
    descriptionTemplate:
      "An offline-first finance agent that analyzes bank data and provides budget recommendations.",
    category: "FinTech",
  },
  {
    nameTemplate: "CritiqueAI",
    descriptionTemplate:
      "A brutally honest AI assistant that provides direct feedback and clarity on projects.",
    category: "Productivity",
  },
  {
    nameTemplate: "LearnLab",
    descriptionTemplate:
      "An educational platform using AI models for step-by-step reasoning and personalized tutoring.",
    category: "Education",
  },
];

let projectCounter = 1000;
const eventProjects = {}; // Track projects per event for prize awards

sampleEvents.forEach((event) => {
  const numProjects = 5 + Math.floor(Math.random() * 3); // 5-7 projects per event
  eventProjects[event.id] = [];

  for (let i = 0; i < numProjects; i++) {
    const template =
      projectTemplates[Math.floor(Math.random() * projectTemplates.length)];
    const projectId = `proj_${String(projectCounter).padStart(4, "0")}`;
    const hackerId = `user_hacker_${String(projectCounter).padStart(4, "0")}`;

    // Generate team members (1-4 members)
    const teamSize = 1 + Math.floor(Math.random() * 4);
    const teamMembers = [];
    for (let j = 0; j < teamSize; j++) {
      const memberName =
        hackerNames[Math.floor(Math.random() * hackerNames.length)];
      teamMembers.push({
        name: memberName,
        role:
          j === 0
            ? "Team Lead"
            : [
                "Frontend Developer",
                "Backend Developer",
                "ML Engineer",
                "Designer",
              ][j % 4],
        githubUsername: memberName.toLowerCase().replace(" ", ""),
        userId: j === 0 ? hackerId : undefined,
      });
    }

    // Generate technologies (2-6 technologies)
    const techCount = 2 + Math.floor(Math.random() * 5);
    const projectTechnologies = [];
    for (let j = 0; j < techCount; j++) {
      const tech =
        technologies[Math.floor(Math.random() * technologies.length)];
      if (!projectTechnologies.includes(tech)) {
        projectTechnologies.push(tech);
      }
    }

    const project = {
      PK: `EVENT#${event.id}`,
      SK: `PROJECT#${projectId}`,
      GSI1PK: `HACKER#${hackerId}`,
      GSI1SK: `PROJECT#${projectId}`,
      entityType: "Project",
      id: projectId,
      eventId: event.id,
      name: `${template.nameTemplate} ${Math.floor(Math.random() * 1000)}`,
      description: template.descriptionTemplate,
      githubUrl: `https://github.com/${teamMembers[0].githubUsername}/hackathon-project-${projectId}`,
      demoUrl: `https://${template.nameTemplate.toLowerCase()}-${projectId}.demo.com`,
      technologies: projectTechnologies,
      teamMembers,
      hackerId,
      isHidden: false,
      createdAt:
        event.status === "upcoming"
          ? generateFutureDate(Math.random() * 30).toISOString()
          : generatePastDate(Math.random() * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sampleProjects.push(project);
    eventProjects[event.id].push(projectId);
    projectCounter++;
  }
});

// Generate prize awards for past and ongoing events
const samplePrizeAwards = [];
let awardCounter = 1;

sampleEvents.forEach((event) => {
  // Only award prizes for past and ongoing events (not future events)
  const eventIdNum = parseInt(event.id.split("_")[1]);
  if (eventIdNum >= 120) {
    // Skip future events
    return;
  }

  const projects = eventProjects[event.id];
  if (!projects || projects.length === 0) {
    return;
  }

  // Award prizes to some projects (not all)
  // First prize: single winner (first project)
  if (event.prizes[0] && projects[0]) {
    samplePrizeAwards.push({
      PK: `EVENT#${event.id}`,
      SK: `PRIZE-AWARD#${event.prizes[0].id}#${projects[0]}`,
      GSI1PK: `PROJECT#${projects[0]}`,
      GSI1SK: `PRIZE-AWARD#${event.prizes[0].id}`,
      entityType: "PrizeAward",
      id: `award_${String(awardCounter).padStart(4, "0")}`,
      projectId: projects[0],
      prizeId: event.prizes[0].id,
      eventId: event.id,
      awardedAt: new Date(
        new Date(event.endDate).getTime() + 2 * 60 * 60 * 1000
      ).toISOString(),
      awardedBy: event.organizerId,
    });
    awardCounter++;
  }

  // Second prize: single winner (second project if exists)
  // Also award this to first project to demonstrate multiple prizes per project
  if (event.prizes[1] && projects[1]) {
    samplePrizeAwards.push({
      PK: `EVENT#${event.id}`,
      SK: `PRIZE-AWARD#${event.prizes[1].id}#${projects[1]}`,
      GSI1PK: `PROJECT#${projects[1]}`,
      GSI1SK: `PRIZE-AWARD#${event.prizes[1].id}`,
      entityType: "PrizeAward",
      id: `award_${String(awardCounter).padStart(4, "0")}`,
      projectId: projects[1],
      prizeId: event.prizes[1].id,
      eventId: event.id,
      awardedAt: new Date(
        new Date(event.endDate).getTime() + 2 * 60 * 60 * 1000
      ).toISOString(),
      awardedBy: event.organizerId,
    });
    awardCounter++;

    // Award second prize to first project as well (for multiple prizes demo)
    if (projects[0] && eventIdNum % 3 === 0) {
      samplePrizeAwards.push({
        PK: `EVENT#${event.id}`,
        SK: `PRIZE-AWARD#${event.prizes[1].id}#${projects[0]}`,
        GSI1PK: `PROJECT#${projects[0]}`,
        GSI1SK: `PRIZE-AWARD#${event.prizes[1].id}`,
        entityType: "PrizeAward",
        id: `award_${String(awardCounter).padStart(4, "0")}`,
        projectId: projects[0],
        prizeId: event.prizes[1].id,
        eventId: event.id,
        awardedAt: new Date(
          new Date(event.endDate).getTime() + 2 * 60 * 60 * 1000
        ).toISOString(),
        awardedBy: event.organizerId,
      });
      awardCounter++;
    }
  }

  // Third prize: multiple winners (up to maxWinners)
  if (event.prizes[2]) {
    const maxWinners = event.prizes[2].maxWinners;
    const winnersCount = Math.min(maxWinners, projects.length - 2);

    for (let i = 0; i < winnersCount; i++) {
      const projectIndex = i + 2; // Start from third project
      if (projects[projectIndex]) {
        samplePrizeAwards.push({
          PK: `EVENT#${event.id}`,
          SK: `PRIZE-AWARD#${event.prizes[2].id}#${projects[projectIndex]}`,
          GSI1PK: `PROJECT#${projects[projectIndex]}`,
          GSI1SK: `PRIZE-AWARD#${event.prizes[2].id}`,
          entityType: "PrizeAward",
          id: `award_${String(awardCounter).padStart(4, "0")}`,
          projectId: projects[projectIndex],
          prizeId: event.prizes[2].id,
          eventId: event.id,
          awardedAt: new Date(
            new Date(event.endDate).getTime() + 2 * 60 * 60 * 1000
          ).toISOString(),
          awardedBy: event.organizerId,
        });
        awardCounter++;
      }
    }
  }

  // Note: Ongoing event (evt_110) intentionally has no prize awards
  // because prizes should only be awarded to past events
});

async function seedData() {
  console.log("=".repeat(80));
  console.log("Seeding AWS DynamoDB with Comprehensive Sample Data");
  console.log("=".repeat(80));
  console.log("");
  console.log("Configuration:");
  console.log(`  - Table: ${TABLE_NAME}`);
  console.log(`  - Region: ${REGION}`);
  console.log("");
  console.log("Data Summary:");
  console.log(`  - Total Events: ${sampleEvents.length}`);
  console.log(
    `  - Past Events: ${
      sampleEvents.filter((e) => e.id.startsWith("evt_1")).length
    }`
  );
  console.log(`  - Ongoing Events: 1`);
  console.log(
    `  - Future Events: ${
      sampleEvents.filter((e) => parseInt(e.id.split("_")[1]) >= 120).length
    }`
  );
  console.log(`  - Total Projects: ${sampleProjects.length}`);
  console.log(`  - Total Prize Awards: ${samplePrizeAwards.length}`);
  console.log("");

  try {
    // Update prize currentWinners counts based on awards
    const prizeWinnerCounts = {};
    for (const award of samplePrizeAwards) {
      const key = `${award.eventId}:${award.prizeId}`;
      prizeWinnerCounts[key] = (prizeWinnerCounts[key] || 0) + 1;
    }

    // Update events with currentWinners counts
    const eventsWithUpdatedPrizes = sampleEvents.map((event) => {
      const updatedPrizes = event.prizes.map((prize) => {
        const key = `${event.id}:${prize.id}`;
        return {
          ...prize,
          currentWinners: prizeWinnerCounts[key] || 0,
        };
      });
      return {
        ...event,
        prizes: updatedPrizes,
      };
    });

    // Seed events
    console.log(`Seeding ${eventsWithUpdatedPrizes.length} events...`);
    for (const event of eventsWithUpdatedPrizes) {
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
      console.log(
        `  ✓ Created project: ${project.name} (Event: ${project.eventId})`
      );
    }

    console.log("");

    // Seed prize awards
    console.log(`Seeding ${samplePrizeAwards.length} prize awards...`);
    for (const award of samplePrizeAwards) {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: award,
        })
      );
      console.log(
        `  ✓ Created prize award: Project ${award.projectId} won ${award.prizeId}`
      );
    }

    console.log("");
    console.log("=".repeat(80));
    console.log("Comprehensive Seeding Complete!");
    console.log("=".repeat(80));
    console.log("");
    console.log("Sample data created:");
    console.log(
      `  - ${eventsWithUpdatedPrizes.length} events (10 past, 1 ongoing, 5 future)`
    );
    console.log(`  - ${sampleProjects.length} projects (5-7 per event)`);
    console.log(`  - ${samplePrizeAwards.length} prize awards`);
    console.log("");
    console.log("Prize award distribution:");
    console.log("  - Past events: All prizes awarded");
    console.log(
      "  - Ongoing event: No prizes awarded (event still in progress)"
    );
    console.log("  - Future events: No prizes awarded yet");
    console.log("  - Some projects have multiple prizes");
    console.log("  - Some projects have no prizes (for filtering demo)");
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
