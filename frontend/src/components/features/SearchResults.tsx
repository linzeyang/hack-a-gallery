"use client";

import React from "react";
import { ProjectCard } from "./ProjectCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Project } from "@/lib/types/project";

import type { PrizeFilterStatus } from "@/lib/types/prize";

export interface SearchResultsProps {
  projects: Project[];
  searchTerm: string;
  activeFilters: {
    technologies: string[];
    events: string[];
    prizeStatus?: PrizeFilterStatus;
    sortBy: string;
  };
  totalCount: number;
  onProjectClick?: (project: Project) => void;
  className?: string;
}

// Utility function to highlight search terms in text (for future enhancement)
// const highlightSearchTerm = (text: string, searchTerm: string): React.ReactNode => {
//   if (!searchTerm.trim()) return text;
//   const escapeRegExp = (string: string) => {
//     return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//   };
//   const regex = new RegExp(`(${escapeRegExp(searchTerm.trim())})`, 'gi');
//   const parts = text.split(regex);
//   return parts.map((part, index) =>
//     regex.test(part) ? (
//       <mark key={index} className="bg-yellow-200 px-1 rounded">
//         {part}
//       </mark>
//     ) : (
//       part
//     )
//   );
// };

// Enhanced ProjectCard with search highlighting (for future enhancement)
// interface HighlightedProjectCardProps {
//   project: Project;
//   searchTerm: string;
//   onClick?: () => void;
// }

// const HighlightedProjectCard: React.FC<HighlightedProjectCardProps> = ({
//   project,
//   searchTerm,
//   onClick,
// }) => {
//   return (
//     <div className="transition-all duration-200 ease-in-out">
//       <ProjectCard
//         project={project}
//         onClick={onClick}
//       />
//     </div>
//   );
// };

export const SearchResults: React.FC<SearchResultsProps> = ({
  projects,
  searchTerm,
  activeFilters,
  totalCount,
  onProjectClick,
  className = "",
}) => {
  const hasActiveFilters =
    activeFilters.technologies.length > 0 ||
    activeFilters.events.length > 0 ||
    (activeFilters.prizeStatus && activeFilters.prizeStatus !== "all") ||
    searchTerm.trim().length > 0;

  const getFilterSummary = () => {
    const parts = [];

    if (searchTerm.trim()) {
      parts.push(`"${searchTerm.trim()}"`);
    }

    if (activeFilters.technologies.length > 0) {
      parts.push(
        `${activeFilters.technologies.length} technology filter${
          activeFilters.technologies.length > 1 ? "s" : ""
        }`
      );
    }

    if (activeFilters.events.length > 0) {
      parts.push(
        `${activeFilters.events.length} event filter${
          activeFilters.events.length > 1 ? "s" : ""
        }`
      );
    }

    if (activeFilters.prizeStatus && activeFilters.prizeStatus !== "all") {
      const prizeLabel =
        activeFilters.prizeStatus === "winners"
          ? "prize winners only"
          : "no prizes";
      parts.push(prizeLabel);
    }

    return parts.join(", ");
  };

  const getSortLabel = () => {
    switch (activeFilters.sortBy) {
      case "date":
        return "most recent first";
      case "title":
        return "alphabetically";
      case "popularity":
        return "most popular first";
      default:
        return "";
    }
  };

  // Empty state scenarios
  if (projects.length === 0) {
    if (!hasActiveFilters) {
      return (
        <div className={className}>
          <EmptyState
            title="No Projects Yet"
            description="Be the first to submit a project!"
            actionLabel="Browse Events"
            onAction={() => {
              /* Navigate to events */
            }}
          />
        </div>
      );
    }

    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No projects found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm.trim()
              ? `No projects match "${searchTerm.trim()}" with the current filters.`
              : "No projects match the current filters."}
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Try:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Removing some filters</li>
              <li>Using different search terms</li>
              <li>Checking for typos</li>
              <li>Browsing all projects</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Results Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {projects.length === totalCount
                ? `${totalCount} project${totalCount !== 1 ? "s" : ""}`
                : `${projects.length} of ${totalCount} project${
                    totalCount !== 1 ? "s" : ""
                  }`}
            </h2>
            {hasActiveFilters && (
              <p className="text-sm text-gray-600 mt-1">
                Filtered by {getFilterSummary()}
              </p>
            )}
          </div>

          {activeFilters.sortBy && (
            <div className="text-sm text-gray-500">Sorted {getSortLabel()}</div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="transition-all duration-200 ease-in-out"
          >
            <ProjectCard
              project={project}
              onClick={() => onProjectClick?.(project)}
            />
          </div>
        ))}
      </div>

      {/* Load More / Pagination Placeholder */}
      {projects.length < totalCount && (
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Showing {projects.length} of {totalCount} projects
          </p>
        </div>
      )}
    </div>
  );
};
