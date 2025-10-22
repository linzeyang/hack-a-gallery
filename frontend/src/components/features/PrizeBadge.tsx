"use client";

import React from "react";

export interface PrizeBadgeProps {
  prizeCount: number;
  className?: string;
}

/**
 * PrizeBadge Component
 *
 * Displays a trophy icon with prize count for projects that have won prizes.
 * Styled with gold/yellow accent colors to indicate achievement.
 */
export const PrizeBadge: React.FC<PrizeBadgeProps> = ({
  prizeCount,
  className = "",
}) => {
  if (prizeCount === 0) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-linear-to-r from-yellow-400 to-amber-500 text-white shadow-md ${className}`}
      role="status"
      aria-label={`Won ${prizeCount} ${prizeCount === 1 ? "prize" : "prizes"}`}
    >
      {/* Trophy Icon */}
      <svg
        className="w-4 h-4 shrink-0"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" />
      </svg>

      {/* Prize Count */}
      <span className="text-xs font-bold">
        {prizeCount} {prizeCount === 1 ? "Prize" : "Prizes"}
      </span>
    </div>
  );
};
