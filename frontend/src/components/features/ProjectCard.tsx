"use client";

import React from "react";
import { Card, CardBody } from "@/components/ui/Card";
import type { Project } from "@/lib/types/project";
import type { Prize } from "@/lib/types/event";
import { PrizeBadge } from "./PrizeBadge";
import { PrizeTooltip } from "./PrizeTooltip";

export interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  showPrizes?: boolean;
  prioritizePrizes?: boolean;
  prizes?: Prize[];
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  showPrizes = true,
  prioritizePrizes = false,
  prizes = [],
}) => {
  // Calculate prize information
  const prizeCount = project.prizeAwards?.length || 0;
  const hasPrizes = prizeCount > 0;

  // Get prize details for tooltip
  const wonPrizes = prizes.filter((prize) =>
    project.prizeAwards?.some((award) => award.prizeId === prize.id)
  );

  // Apply special styling for prize winners when prioritizePrizes is true
  const cardClassName =
    prioritizePrizes && hasPrizes
      ? "cursor-pointer border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50"
      : "cursor-pointer";

  return (
    <Card
      hover
      className={cardClassName}
      onClick={onClick}
      role="article"
      aria-label={`Project: ${project.name}${
        hasPrizes
          ? ` - Won ${prizeCount} ${prizeCount === 1 ? "prize" : "prizes"}`
          : ""
      }`}
    >
      <CardBody className="p-4 sm:p-6 relative">
        {/* Prize Badge - Top Right Corner */}
        {showPrizes && hasPrizes && (
          <div className="absolute top-4 right-4 z-10">
            <PrizeTooltip prizes={wonPrizes}>
              <PrizeBadge prizeCount={prizeCount} />
            </PrizeTooltip>
          </div>
        )}

        {/* Project Name */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2 pr-24">
          {project.name}
        </h3>

        {/* Project Description */}
        <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-3">
          {project.description}
        </p>

        {/* Technology Stack */}
        {project.technologies.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {project.technologies.slice(0, 5).map((tech, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tech}
                </span>
              ))}
              {project.technologies.length > 5 && (
                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{project.technologies.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Team Members */}
        {project.teamMembers.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500 mb-2">Team</p>
            <div className="flex flex-wrap gap-2">
              {project.teamMembers.slice(0, 3).map((member, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 min-w-0"
                  title={`${member.name} - ${member.role}`}
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">
                    {member.name}
                  </span>
                </div>
              ))}
              {project.teamMembers.length > 3 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-semibold">
                    +{project.teamMembers.length - 3}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Links Preview */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
          {project.githubUrl && (
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>GitHub</span>
            </div>
          )}
          {project.demoUrl && (
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span>Demo</span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
