import { Project } from "../types/project";
import { PrizeFilterStatus } from "../types/prize";

/**
 * Prize status type indicating whether a project has won prizes
 */
export type PrizeStatus = "winner" | "none";

/**
 * Calculates the prize status for a given project
 *
 * @param project - The project to check for prize awards
 * @returns 'winner' if the project has won at least one prize, 'none' otherwise
 *
 * @example
 * ```typescript
 * const project = { prizeAwards: [{ id: '1', ... }], ... };
 * const status = calculatePrizeStatus(project); // Returns 'winner'
 *
 * const projectWithoutPrizes = { prizeAwards: [], ... };
 * const status2 = calculatePrizeStatus(projectWithoutPrizes); // Returns 'none'
 * ```
 */
export function calculatePrizeStatus(project: Project): PrizeStatus {
  return project.prizeAwards && project.prizeAwards.length > 0
    ? "winner"
    : "none";
}

/**
 * Sorts an array of projects by prize status, placing prize winners first
 *
 * This function performs a stable sort, meaning projects within the same category
 * (winners or non-winners) maintain their relative order from the input array.
 *
 * @param projects - Array of projects to sort
 * @returns A new sorted array with prize-winning projects first, followed by others
 *
 * @example
 * ```typescript
 * const projects = [
 *   { id: '1', prizeAwards: [], ... },
 *   { id: '2', prizeAwards: [{ id: 'award1', ... }], ... },
 *   { id: '3', prizeAwards: [], ... },
 * ];
 * const sorted = sortProjectsByPrizeStatus(projects);
 * // Result: [project2, project1, project3]
 * ```
 */
export function sortProjectsByPrizeStatus(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const aHasPrizes = a.prizeAwards && a.prizeAwards.length > 0;
    const bHasPrizes = b.prizeAwards && b.prizeAwards.length > 0;

    // Prize winners come first
    if (aHasPrizes && !bHasPrizes) return -1;
    if (!aHasPrizes && bHasPrizes) return 1;

    // Maintain stable sort for projects in same category
    return 0;
  });
}

/**
 * Filters an array of projects based on their prize status
 *
 * @param projects - Array of projects to filter
 * @param status - Filter criteria: 'all' (no filtering), 'winners' (only prize winners),
 *                 or 'no-prizes' (only projects without prizes)
 * @returns Filtered array of projects matching the specified status
 *
 * @example
 * ```typescript
 * const projects = [
 *   { id: '1', prizeAwards: [], ... },
 *   { id: '2', prizeAwards: [{ id: 'award1', ... }], ... },
 * ];
 *
 * const winners = filterProjectsByPrizeStatus(projects, 'winners');
 * // Returns: [project2]
 *
 * const noPrizes = filterProjectsByPrizeStatus(projects, 'no-prizes');
 * // Returns: [project1]
 *
 * const all = filterProjectsByPrizeStatus(projects, 'all');
 * // Returns: [project1, project2]
 * ```
 */
export function filterProjectsByPrizeStatus(
  projects: Project[],
  status: PrizeFilterStatus
): Project[] {
  switch (status) {
    case "winners":
      return projects.filter((p) => p.prizeAwards && p.prizeAwards.length > 0);
    case "no-prizes":
      return projects.filter(
        (p) => !p.prizeAwards || p.prizeAwards.length === 0
      );
    case "all":
    default:
      return projects;
  }
}
