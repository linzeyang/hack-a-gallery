"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

export interface FilterControlsProps {
  technologies: FilterOption[];
  events: FilterOption[];
  selectedTechnologies: string[];
  selectedEvents: string[];
  sortBy: "date" | "title" | "popularity";
  onTechnologyChange: (technologies: string[]) => void;
  onEventChange: (events: string[]) => void;
  onSortChange: (sort: "date" | "title" | "popularity") => void;
  onClearAll: () => void;
  className?: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOption = (optionId: string) => {
    const newValues = selectedValues.includes(optionId)
      ? selectedValues.filter((id) => id !== optionId)
      : [...selectedValues, optionId];
    onChange(newValues);
  };

  const selectedCount = selectedValues.length;
  const displayText =
    selectedCount === 0 ? placeholder : `${selectedCount} selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] flex items-center justify-between"
        aria-label={`${label} filter`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span
          className={selectedCount === 0 ? "text-gray-500" : "text-gray-900"}
        >
          {displayText}
        </span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="py-1" role="listbox" aria-label={`${label} options`}>
            {options.map((option) => (
              <label
                key={option.id}
                className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer min-h-[44px]"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.id)}
                  onChange={() => handleToggleOption(option.id)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  aria-describedby={`${option.id}-label`}
                />
                <span
                  id={`${option.id}-label`}
                  className="ml-3 text-sm text-gray-900 flex-1"
                >
                  {option.name}
                  {option.count !== undefined && (
                    <span className="text-gray-500 ml-1">({option.count})</span>
                  )}
                </span>
              </label>
            ))}
            {options.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-500">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const FilterControls: React.FC<FilterControlsProps> = ({
  technologies,
  events,
  selectedTechnologies,
  selectedEvents,
  sortBy,
  onTechnologyChange,
  onEventChange,
  onSortChange,
  onClearAll,
  className = "",
}) => {
  const hasActiveFilters =
    selectedTechnologies.length > 0 || selectedEvents.length > 0;

  const handleRemoveTechnology = (techId: string) => {
    onTechnologyChange(selectedTechnologies.filter((id) => id !== techId));
  };

  const handleRemoveEvent = (eventId: string) => {
    onEventChange(selectedEvents.filter((id) => id !== eventId));
  };

  const sortOptions = [
    { value: "date", label: "Most Recent" },
    { value: "title", label: "Alphabetical" },
    { value: "popularity", label: "Most Popular" },
  ] as const;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Controls Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Technology Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Technologies
          </label>
          <MultiSelectDropdown
            label="Technologies"
            options={technologies}
            selectedValues={selectedTechnologies}
            onChange={onTechnologyChange}
            placeholder="Select technologies"
          />
        </div>

        {/* Event Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Events
          </label>
          <MultiSelectDropdown
            label="Events"
            options={events}
            selectedValues={selectedEvents}
            onChange={onEventChange}
            placeholder="Select events"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) =>
              onSortChange(e.target.value as "date" | "title" | "popularity")
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            aria-label="Sort projects by"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <Button
              variant="outline"
              size="md"
              onClick={onClearAll}
              className="whitespace-nowrap"
              aria-label="Clear all filters"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Active Filter Indicators */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>

          {/* Technology Tags */}
          {selectedTechnologies.map((techId) => {
            const tech = technologies.find((t) => t.id === techId);
            return tech ? (
              <span
                key={techId}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {tech.name}
                <button
                  type="button"
                  onClick={() => handleRemoveTechnology(techId)}
                  className="ml-2 hover:text-blue-600 focus:outline-none focus:text-blue-600"
                  aria-label={`Remove ${tech.name} filter`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ) : null;
          })}

          {/* Event Tags */}
          {selectedEvents.map((eventId) => {
            const event = events.find((e) => e.id === eventId);
            return event ? (
              <span
                key={eventId}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
              >
                {event.name}
                <button
                  type="button"
                  onClick={() => handleRemoveEvent(eventId)}
                  className="ml-2 hover:text-green-600 focus:outline-none focus:text-green-600"
                  aria-label={`Remove ${event.name} filter`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};
