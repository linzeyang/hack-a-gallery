import { describe, it, expect } from "vitest";
import {
  filterProjectsByText,
  filterProjectsByTechnologies,
  filterProjectsByEvents,
  filterProjects,
  sortProjectsByDate,
  sortProjectsByTitle,
  sortProjectsByPopularity,
  sortProjects,
  extractUniqueTechnologies,
  calculateEventCounts,
  highlightSearchTerm,
  filterAndSortProjects,
  type FilterCriteria,
} from "./search";
import type { Project } from "../types/project";
import type { Event } from "../types/event";

// Mock data for testing
const mockProjects: Project[] = [
  {
    id: "proj_1",
    eventId: "evt_1",
    name: "React Dashboard",
    description: "A modern dashboard built with React and TypeScript",
    githubUrl: "https://github.com/user/react-dashboard",
    technologies: ["React", "TypeScript", "Tailwind CSS"],
    teamMembers: [
      { name: "John Doe", role: "Frontend Developer" },
      { name: "Jane Smith", role: "Designer" },
    ],
    hackerId: "user_1",
    isHidden: false,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "proj_2",
    eventId: "evt_2",
    name: "Python API Server",
    description: "RESTful API server built with FastAPI and PostgreSQL",
    githubUrl: "https://github.com/user/python-api",
    technologies: ["Python", "FastAPI", "PostgreSQL"],
    teamMembers: [{ name: "Bob Wilson", role: "Backend Developer" }],
    hackerId: "user_2",
    isHidden: false,
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "proj_3",
    eventId: "evt_1",
    name: "Mobile Chat App",
    description: "Real-time chat application for mobile devices",
    githubUrl: "https://github.com/user/mobile-chat",
    technologies: ["React Native", "Node.js", "Socket.io"],
    teamMembers: [
      { name: "Alice Johnson", role: "Mobile Developer" },
      { name: "Charlie Brown", role: "Backend Developer" },
      { name: "Diana Prince", role: "UI/UX Designer" },
    ],
    hackerId: "user_3",
    isHidden: false,
    createdAt: "2024-01-20T14:00:00Z",
    updatedAt: "2024-01-20T14:00:00Z",
  },
];

const mockEvents: Event[] = [
  {
    id: "evt_1",
    name: "Tech Hackathon 2024",
    description: "Annual technology hackathon",
    startDate: "2024-01-15T00:00:00Z",
    endDate: "2024-01-17T00:00:00Z",
    location: "San Francisco",
    prizes: [],
    requirements: "Open to all",
    organizerId: "org_1",
    organizerName: "Tech Corp",
    isHidden: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "evt_2",
    name: "AI Innovation Challenge",
    description: "AI-focused hackathon",
    startDate: "2024-01-10T00:00:00Z",
    endDate: "2024-01-12T00:00:00Z",
    location: "New York",
    prizes: [],
    requirements: "AI projects only",
    organizerId: "org_2",
    organizerName: "AI Labs",
    isHidden: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

describe("Search and Filter Functions", () => {
  describe("filterProjectsByText", () => {
    it("should return all projects when search term is empty", () => {
      const result = filterProjectsByText(mockProjects, "");
      expect(result).toHaveLength(3);
    });

    it("should filter projects by name", () => {
      const result = filterProjectsByText(mockProjects, "Dashboard");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("React Dashboard");
    });

    it("should filter projects by description", () => {
      const result = filterProjectsByText(mockProjects, "API");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Python API Server");
    });

    it("should filter projects by technologies", () => {
      const result = filterProjectsByText(mockProjects, "TypeScript");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("React Dashboard");
    });

    it("should be case insensitive", () => {
      const result = filterProjectsByText(mockProjects, "react");
      expect(result).toHaveLength(2); // React Dashboard and React Native
    });

    it("should handle partial matches", () => {
      const result = filterProjectsByText(mockProjects, "chat");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Mobile Chat App");
    });
  });

  describe("filterProjectsByTechnologies", () => {
    it("should return all projects when no technologies selected", () => {
      const result = filterProjectsByTechnologies(mockProjects, []);
      expect(result).toHaveLength(3);
    });

    it("should filter projects by single technology", () => {
      const result = filterProjectsByTechnologies(mockProjects, ["React"]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("React Dashboard");
    });

    it("should filter projects by multiple technologies (OR logic)", () => {
      const result = filterProjectsByTechnologies(mockProjects, [
        "React",
        "Python",
      ]);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no projects match", () => {
      const result = filterProjectsByTechnologies(mockProjects, ["Java"]);
      expect(result).toHaveLength(0);
    });
  });

  describe("filterProjectsByEvents", () => {
    it("should return all projects when no events selected", () => {
      const result = filterProjectsByEvents(mockProjects, []);
      expect(result).toHaveLength(3);
    });

    it("should filter projects by single event", () => {
      const result = filterProjectsByEvents(mockProjects, ["evt_1"]);
      expect(result).toHaveLength(2);
    });

    it("should filter projects by multiple events", () => {
      const result = filterProjectsByEvents(mockProjects, ["evt_1", "evt_2"]);
      expect(result).toHaveLength(3);
    });

    it("should return empty array when no projects match", () => {
      const result = filterProjectsByEvents(mockProjects, ["evt_999"]);
      expect(result).toHaveLength(0);
    });
  });

  describe("filterProjects", () => {
    it("should apply all filters together", () => {
      const criteria: FilterCriteria = {
        searchTerm: "React",
        selectedTechnologies: ["React"],
        selectedEvents: ["evt_1"],
        sortBy: "date",
      };
      const result = filterProjects(mockProjects, criteria);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("React Dashboard");
    });

    it("should return empty array when filters exclude all projects", () => {
      const criteria: FilterCriteria = {
        searchTerm: "React",
        selectedTechnologies: ["Python"],
        selectedEvents: [],
        sortBy: "date",
      };
      const result = filterProjects(mockProjects, criteria);
      expect(result).toHaveLength(0);
    });
  });

  describe("sortProjectsByDate", () => {
    it("should sort projects by creation date in descending order", () => {
      const result = sortProjectsByDate(mockProjects);
      expect(result[0].name).toBe("Mobile Chat App"); // 2024-01-20
      expect(result[1].name).toBe("React Dashboard"); // 2024-01-15
      expect(result[2].name).toBe("Python API Server"); // 2024-01-10
    });

    it("should not mutate original array", () => {
      const original = [...mockProjects];
      sortProjectsByDate(mockProjects);
      expect(mockProjects).toEqual(original);
    });
  });

  describe("sortProjectsByTitle", () => {
    it("should sort projects alphabetically by name", () => {
      const result = sortProjectsByTitle(mockProjects);
      expect(result[0].name).toBe("Mobile Chat App");
      expect(result[1].name).toBe("Python API Server");
      expect(result[2].name).toBe("React Dashboard");
    });

    it("should not mutate original array", () => {
      const original = [...mockProjects];
      sortProjectsByTitle(mockProjects);
      expect(mockProjects).toEqual(original);
    });
  });

  describe("sortProjectsByPopularity", () => {
    it("should sort projects by team member count in descending order", () => {
      const result = sortProjectsByPopularity(mockProjects);
      expect(result[0].name).toBe("Mobile Chat App"); // 3 members
      expect(result[1].name).toBe("React Dashboard"); // 2 members
      expect(result[2].name).toBe("Python API Server"); // 1 member
    });

    it("should not mutate original array", () => {
      const original = [...mockProjects];
      sortProjectsByPopularity(mockProjects);
      expect(mockProjects).toEqual(original);
    });
  });

  describe("sortProjects", () => {
    it('should sort by date when sortBy is "date"', () => {
      const result = sortProjects(mockProjects, "date");
      expect(result[0].name).toBe("Mobile Chat App");
    });

    it('should sort by title when sortBy is "title"', () => {
      const result = sortProjects(mockProjects, "title");
      expect(result[0].name).toBe("Mobile Chat App");
    });

    it('should sort by popularity when sortBy is "popularity"', () => {
      const result = sortProjects(mockProjects, "popularity");
      expect(result[0].name).toBe("Mobile Chat App");
    });

    it("should return original array for unknown sort type", () => {
      const result = sortProjects(mockProjects, "unknown" as unknown);
      expect(result).toEqual(mockProjects);
    });
  });

  describe("extractUniqueTechnologies", () => {
    it("should extract all unique technologies from projects", () => {
      const result = extractUniqueTechnologies(mockProjects);
      expect(result).toContain("React");
      expect(result).toContain("TypeScript");
      expect(result).toContain("Python");
      expect(result).toContain("FastAPI");
      expect(result).toContain("React Native");
      expect(result).toContain("Node.js");
    });

    it("should return sorted array", () => {
      const result = extractUniqueTechnologies(mockProjects);
      const sorted = [...result].sort();
      expect(result).toEqual(sorted);
    });

    it("should handle empty projects array", () => {
      const result = extractUniqueTechnologies([]);
      expect(result).toEqual([]);
    });
  });

  describe("calculateEventCounts", () => {
    it("should calculate project counts for each event", () => {
      const result = calculateEventCounts(mockEvents, mockProjects);
      expect(result).toHaveLength(2);

      const evt1 = result.find((e) => e.id === "evt_1");
      const evt2 = result.find((e) => e.id === "evt_2");

      expect(evt1?.projectCount).toBe(2);
      expect(evt2?.projectCount).toBe(1);
    });

    it("should filter out events with zero projects", () => {
      const eventsWithEmpty = [
        ...mockEvents,
        {
          id: "evt_3",
          name: "Empty Event",
          description: "No projects",
          startDate: "2024-01-01T00:00:00Z",
          endDate: "2024-01-02T00:00:00Z",
          location: "Nowhere",
          prizes: [],
          requirements: "None",
          organizerId: "org_3",
          organizerName: "Nobody",
          isHidden: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const result = calculateEventCounts(eventsWithEmpty, mockProjects);
      expect(result).toHaveLength(2);
      expect(result.find((e) => e.id === "evt_3")).toBeUndefined();
    });

    it("should sort events by project count in descending order", () => {
      const result = calculateEventCounts(mockEvents, mockProjects);
      expect(result[0].projectCount).toBeGreaterThanOrEqual(
        result[1].projectCount
      );
    });
  });

  describe("highlightSearchTerm", () => {
    it("should return original text when search term is empty", () => {
      const result = highlightSearchTerm("Hello world", "");
      expect(result).toBe("Hello world");
    });

    it("should highlight matching terms", () => {
      const result = highlightSearchTerm("Hello world", "world");
      // Since we're returning React elements, we need to check the structure
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle case insensitive matching", () => {
      const result = highlightSearchTerm("Hello World", "world");
      expect(Array.isArray(result)).toBe(true);
    });

    it("should escape special regex characters", () => {
      const result = highlightSearchTerm("Hello (world)", "(world)");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("filterAndSortProjects", () => {
    it("should combine filtering and sorting", () => {
      const criteria: FilterCriteria = {
        searchTerm: "",
        selectedTechnologies: [],
        selectedEvents: [],
        sortBy: "date",
      };

      const result = filterAndSortProjects(mockProjects, criteria);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("Mobile Chat App"); // Most recent
    });

    it("should apply filters before sorting", () => {
      const criteria: FilterCriteria = {
        searchTerm: "React",
        selectedTechnologies: [],
        selectedEvents: [],
        sortBy: "title",
      };

      const result = filterAndSortProjects(mockProjects, criteria);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Mobile Chat App"); // Alphabetically first
    });
  });
});
