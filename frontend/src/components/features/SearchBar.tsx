"use client";

import React, { useState, useEffect, useCallback } from "react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search projects...",
  className = "",
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Debounced onChange handler
  const debouncedOnChange = useCallback(
    (searchValue: string) => {
      const timeoutId = setTimeout(() => {
        onChange(searchValue);
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    },
    [onChange, debounceMs]
  );

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle debounced search
  useEffect(() => {
    const cleanup = debouncedOnChange(localValue);
    return cleanup;
  }, [localValue, debouncedOnChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  const baseStyles =
    "w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] text-base";
  const combinedClassName = `${baseStyles} ${className}`;

  return (
    <div className="relative w-full">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
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
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={localValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={combinedClassName}
        aria-label="Search projects"
        role="searchbox"
      />

      {/* Clear Button */}
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 focus:outline-none focus:text-gray-600 min-h-[44px] min-w-[44px]"
          aria-label="Clear search"
        >
          <svg
            className="h-5 w-5 text-gray-400 hover:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
