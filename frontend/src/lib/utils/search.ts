import React from "react";
import { Project } from "../types/project";
import { Event } from "../types/event";

export interface FilterCriteria {
  searchTerm: string;
  selectedTechnologies: string[];
  selectedEvents: string[];
  sortBy: "date" | "title" | "popularity";
}

/**
 * Filters projects based on text search across name, description, and technologies
 */
export function filterProjectsByText(
  projects: Project[],
  searchTerm: string
): Project[] {
  if (!searchTerm.trim()) {
    return projects;
  }

  const searchLower = searchTerm.toLowerCase().trim();

  return projects.filter((project) => {
    // Search in project name
    if (project.name.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search in project description
    if (project.description.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search in technologies array
    if (
      project.technologies.some((tech) =>
        tech.toLowerCase().includes(searchLower)
      )
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Filters projects by selected technologies
 */
export function filterProjectsByTechnologies(
  projects: Project[],
  selectedTechnologies: string[]
): Project[] {
  if (selectedTechnologies.length === 0) {
    return projects;
  }

  return projects.filter((project) =>
    selectedTechnologies.some((tech) => project.technologies.includes(tech))
  );
}

/**
 * Filters projects by selected events
 */
export function filterProjectsByEvents(
  projects: Project[],
  selectedEvents: string[]
): Project[] {
  if (selectedEvents.length === 0) {
    return projects;
  }

  return projects.filter((project) => selectedEvents.includes(project.eventId));
}

/**
 * Combines all filter criteria and returns filtered projects
 */
export function filterProjects(
  projects: Project[],
  criteria: FilterCriteria
): Project[] {
  let filtered = projects;

  // Apply text search filter
  filtered = filterProjectsByText(filtered, criteria.searchTerm);

  // Apply technology filter
  filtered = filterProjectsByTechnologies(
    filtered,
    criteria.selectedTechnologies
  );

  // Apply event filter
  filtered = filterProjectsByEvents(filtered, criteria.selectedEvents);

  return filtered;
}
/**
 *
 Sorts projects by date (createdAt) in descending order (newest first)
 */
export function sortProjectsByDate(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Descending order (newest first)
  });
}

/**
 * Sorts projects alphabetically by title with locale-aware comparison
 */
export function sortProjectsByTitle(projects: Project[]): Project[] {
  return [...projects].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
      numeric: true,
    })
  );
}

/**
 * Sorts projects by popularity (using team member count as a proxy for popularity)
 * In the future, this could use views, likes, or other metrics
 */
export function sortProjectsByPopularity(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    // Use team member count as popularity metric
    const popularityA = a.teamMembers.length;
    const popularityB = b.teamMembers.length;
    return popularityB - popularityA; // Descending order (most popular first)
  });
}

/**
 * Sorts projects based on the specified sort criteria
 */
export function sortProjects(
  projects: Project[],
  sortBy: "date" | "title" | "popularity"
): Project[] {
  switch (sortBy) {
    case "date":
      return sortProjectsByDate(projects);
    case "title":
      return sortProjectsByTitle(projects);
    case "popularity":
      return sortProjectsByPopularity(projects);
    default:
      return projects;
  }
} /**
 *
 Extracts unique technologies from all projects and returns them sorted
 */
export function extractUniqueTechnologies(projects: Project[]): string[] {
  const techSet = new Set<string>();

  projects.forEach((project) => {
    project.technologies.forEach((tech) => {
      techSet.add(tech);
    });
  });

  return Array.from(techSet).sort();
}

/**
 * Calculates project counts for each event
 */
export function calculateEventCounts(
  events: Event[],
  projects: Project[]
): Array<{ id: string; name: string; projectCount: number }> {
  return events
    .map((event) => ({
      id: event.id,
      name: event.name,
      projectCount: projects.filter((project) => project.eventId === event.id)
        .length,
    }))
    .filter((event) => event.projectCount > 0)
    .sort((a, b) => b.projectCount - a.projectCount); // Sort by project count descending
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlights search terms in text by wrapping matches with mark elements
 */
export function highlightSearchTerm(
  text: string,
  searchTerm: string
): React.ReactNode {
  if (!searchTerm.trim()) {
    return text;
  }

  const escapedSearchTerm = escapeRegExp(searchTerm.trim());
  const regex = new RegExp(`(${escapedSearchTerm})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return React.createElement(
        "mark",
        {
          key: index,
          className: "bg-yellow-200 px-1 rounded",
        },
        part
      );
    }
    return part;
  });
} /**

 * Main function that combines filtering and sorting of projects
 */
export function filterAndSortProjects(
  projects: Project[],
  criteria: FilterCriteria
): Project[] {
  // First apply all filters
  let filtered = filterProjects(projects, criteria);

  // Then apply sorting
  filtered = sortProjects(filtered, criteria.sortBy);

  return filtered;
}
