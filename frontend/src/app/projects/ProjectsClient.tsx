"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import { SearchBar } from "@/components/features/SearchBar";
import { FilterControls } from "@/components/features/FilterControls";
import { SearchResults } from "@/components/features/SearchResults";
import {
  filterAndSortProjects,
  extractUniqueTechnologies,
  calculateEventCounts,
} from "@/lib/utils/search";
import type { Project } from "@/lib/types/project";
import type { Event } from "@/lib/types/event";
import type { PrizeFilterStatus } from "@/lib/types/prize";

interface ProjectsClientProps {
  projects: Project[];
  events: Event[];
}

export function ProjectsClient({ projects, events }: ProjectsClientProps) {
  const router = useRouter();

  // Search state management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(
    []
  );
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [prizeStatus, setPrizeStatus] = useState<PrizeFilterStatus>("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "popularity">("date");

  // Derived data with memoization
  const availableTechnologies = useMemo(() => {
    return extractUniqueTechnologies(projects).map((tech) => ({
      id: tech,
      name: tech,
    }));
  }, [projects]);

  const eventsWithCounts = useMemo(() => {
    return calculateEventCounts(events, projects);
  }, [events, projects]);

  // Filtered projects with memoization for efficient re-filtering
  const filteredProjects = useMemo(() => {
    return filterAndSortProjects(projects, {
      searchTerm,
      selectedTechnologies,
      selectedEvents,
      prizeStatus,
      sortBy,
    });
  }, [
    projects,
    searchTerm,
    selectedTechnologies,
    selectedEvents,
    prizeStatus,
    sortBy,
  ]);

  // Clear all filters handler
  const handleClearAll = () => {
    setSearchTerm("");
    setSelectedTechnologies([]);
    setSelectedEvents([]);
    setPrizeStatus("all");
    setSortBy("date");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            All Projects
          </h1>
          <p className="text-gray-600">
            Explore amazing hackathon projects from our community
          </p>
        </div>

        {/* Search Interface */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search projects by name, description, or technology..."
            className="max-w-2xl mx-auto"
          />

          {/* Filter Controls */}
          <FilterControls
            technologies={availableTechnologies}
            events={eventsWithCounts}
            selectedTechnologies={selectedTechnologies}
            selectedEvents={selectedEvents}
            prizeStatus={prizeStatus}
            sortBy={sortBy}
            onTechnologyChange={setSelectedTechnologies}
            onEventChange={setSelectedEvents}
            onPrizeStatusChange={setPrizeStatus}
            onSortChange={setSortBy}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Search Results */}
        <SearchResults
          projects={filteredProjects}
          searchTerm={searchTerm}
          activeFilters={{
            technologies: selectedTechnologies,
            events: selectedEvents,
            prizeStatus,
            sortBy,
          }}
          totalCount={projects.length}
          onProjectClick={(project) => router.push(`/projects/${project.id}`)}
        />
      </div>
    </div>
  );
}
