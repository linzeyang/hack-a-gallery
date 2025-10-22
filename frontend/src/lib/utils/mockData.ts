import type { Event } from "@/lib/types/event";
import type { Project } from "@/lib/types/project";

/**
 * Mock Events
 *
 * Sample hackathon events for development and demo purposes.
 * These can be used to populate the application with initial data.
 */
export const mockEvents: Event[] = [
  {
    id: "1",
    name: "AWS AI Agent Global Hackathon 2025",
    description:
      "Build tomorrow's AI solution today! Join developers worldwide in creating innovative AI agents powered by AWS services. Whether you're building chatbots, automation tools, or intelligent assistants, this is your chance to showcase your skills and win amazing prizes.",
    startDate: "2025-10-15",
    endDate: "2025-10-21",
    location: "Virtual",
    prizes: [
      {
        id: "prize_1",
        title: "Grand Prize",
        amount: "$10,000",
        description: "Best overall AI agent project",
        maxWinners: 1,
        currentWinners: 0,
      },
      {
        id: "prize_2",
        title: "Innovation Award",
        amount: "$5,000",
        description: "Most innovative use of AWS AI services",
        maxWinners: 1,
        currentWinners: 0,
      },
      {
        id: "prize_3",
        title: "Community Choice",
        amount: "$3,000",
        description: "Voted by the community",
        maxWinners: 1,
        currentWinners: 0,
      },
    ],
    requirements:
      "Must use at least one AWS AI service (Bedrock, SageMaker, Comprehend, etc.). Open source code required.",
    organizerId: "org1",
    organizerName: "AWS",
    isHidden: false,
    createdAt: "2025-10-01T00:00:00Z",
    updatedAt: "2025-10-01T00:00:00Z",
  },
  {
    id: "2",
    name: "FinTech Innovation Challenge 2025",
    description:
      "Transform the future of finance! Build cutting-edge financial technology solutions that make banking, investing, and payments more accessible and secure for everyone.",
    startDate: "2025-11-01",
    endDate: "2025-11-07",
    location: "San Francisco, CA",
    prizes: [
      {
        id: "prize_4",
        title: "First Place",
        amount: "$15,000",
        description: "Best FinTech solution",
        maxWinners: 1,
        currentWinners: 0,
      },
      {
        id: "prize_5",
        title: "Second Place",
        amount: "$7,500",
        description: "Runner-up",
        maxWinners: 1,
        currentWinners: 0,
      },
    ],
    requirements:
      "Focus on financial technology. Must address a real-world problem in banking, payments, or investing.",
    organizerId: "org2",
    organizerName: "FinTech Ventures",
    isHidden: false,
    createdAt: "2025-10-05T00:00:00Z",
    updatedAt: "2025-10-05T00:00:00Z",
  },
  {
    id: "3",
    name: "HealthTech Hackathon 2025",
    description:
      "Code for a healthier tomorrow! Create innovative healthcare solutions that improve patient outcomes, streamline medical workflows, or make healthcare more accessible.",
    startDate: "2025-12-01",
    endDate: "2025-12-03",
    location: "Boston, MA",
    prizes: [
      {
        id: "prize_6",
        title: "Winner",
        amount: "$8,000",
        description: "Best healthcare innovation",
        maxWinners: 1,
        currentWinners: 0,
      },
    ],
    requirements:
      "Must focus on healthcare or medical technology. HIPAA compliance considerations required.",
    organizerId: "org3",
    organizerName: "HealthTech Alliance",
    isHidden: false,
    createdAt: "2025-10-10T00:00:00Z",
    updatedAt: "2025-10-10T00:00:00Z",
  },
];

/**
 * Mock Projects
 *
 * Sample hackathon projects for development and demo purposes.
 * These showcase different types of projects and technologies.
 */
export const mockProjects: Project[] = [
  {
    id: "1",
    eventId: "1",
    name: "HackaGallery",
    description:
      "An AI-powered platform that showcases hackathon projects and preserves innovation. Features intelligent project discovery, automated documentation, and a beautiful gallery interface for exploring hackathon submissions.",
    githubUrl: "https://github.com/example/hackagallery",
    demoUrl: "https://hackagallery.com",
    technologies: [
      "Next.js",
      "TypeScript",
      "AWS Bedrock",
      "TailwindCSS",
      "DynamoDB",
    ],
    teamMembers: [
      {
        name: "John Doe",
        role: "Full Stack Developer",
        githubUsername: "johndoe",
      },
      {
        name: "Jane Smith",
        role: "UI/UX Designer",
        githubUsername: "janesmith",
      },
    ],
    hackerId: "hacker1",
    isHidden: false,
    prizeAwards: [],
    hasPrizes: false,
    createdAt: "2025-10-15T00:00:00Z",
    updatedAt: "2025-10-15T00:00:00Z",
  },
  {
    id: "2",
    eventId: "1",
    name: "CodeCompanion AI",
    description:
      "An intelligent coding assistant that helps developers write better code faster. Uses AWS Bedrock to provide context-aware suggestions, code reviews, and documentation generation.",
    githubUrl: "https://github.com/example/codecompanion",
    demoUrl: "https://codecompanion.dev",
    technologies: ["Python", "AWS Bedrock", "FastAPI", "React", "PostgreSQL"],
    teamMembers: [
      {
        name: "Alex Johnson",
        role: "Backend Developer",
        githubUsername: "alexj",
      },
      {
        name: "Maria Garcia",
        role: "ML Engineer",
        githubUsername: "mariag",
      },
      {
        name: "Chris Lee",
        role: "Frontend Developer",
        githubUsername: "chrisl",
      },
    ],
    hackerId: "hacker2",
    isHidden: false,
    prizeAwards: [],
    hasPrizes: false,
    createdAt: "2025-10-16T00:00:00Z",
    updatedAt: "2025-10-16T00:00:00Z",
  },
  {
    id: "3",
    eventId: "2",
    name: "PayFlow",
    description:
      "A modern payment processing platform that simplifies international transactions. Features real-time currency conversion, fraud detection, and seamless integration with existing banking systems.",
    githubUrl: "https://github.com/example/payflow",
    technologies: ["Node.js", "Express", "MongoDB", "Stripe API", "Vue.js"],
    teamMembers: [
      {
        name: "Sarah Williams",
        role: "Lead Developer",
        githubUsername: "sarahw",
      },
      {
        name: "David Brown",
        role: "Security Engineer",
        githubUsername: "davidb",
      },
    ],
    hackerId: "hacker3",
    isHidden: false,
    prizeAwards: [],
    hasPrizes: false,
    createdAt: "2025-11-02T00:00:00Z",
    updatedAt: "2025-11-02T00:00:00Z",
  },
];
