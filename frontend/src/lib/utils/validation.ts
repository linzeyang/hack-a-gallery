import type { Event } from "@/lib/types/event";
import type { Project } from "@/lib/types/project";
import type { ValidationResult } from "@/lib/types/service";

/**
 * URL Validation Helper
 *
 * Validates if a string is a valid URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate Event Data
 *
 * Validates event form data before submission.
 * Checks required fields, date logic, and data formats.
 *
 * @param event - Partial event data to validate
 * @returns ValidationResult with isValid flag and errors object
 */
export function validateEvent(event: Partial<Event>): ValidationResult {
  const errors: Record<string, string> = {};

  // Required field validations
  if (!event.name?.trim()) {
    errors.name = "Event name is required";
  }

  if (!event.description?.trim()) {
    errors.description = "Description is required";
  }

  if (!event.startDate) {
    errors.startDate = "Start date is required";
  }

  if (!event.endDate) {
    errors.endDate = "End date is required";
  }

  if (!event.location?.trim()) {
    errors.location = "Location is required";
  }

  if (!event.organizerName?.trim()) {
    errors.organizerName = "Organizer name is required";
  }

  // Date logic validation
  if (event.startDate && event.endDate) {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (start > end) {
      errors.endDate = "End date must be after start date";
    }
  }

  // Prizes validation (optional but must be valid if provided)
  if (event.prizes && event.prizes.length > 0) {
    event.prizes.forEach((prize, index) => {
      if (!prize.title?.trim()) {
        errors[`prize_${index}_title`] = `Prize ${index + 1} title is required`;
      }
      if (!prize.amount?.trim()) {
        errors[`prize_${index}_amount`] = `Prize ${
          index + 1
        } amount is required`;
      }
      if (
        prize.maxWinners !== undefined &&
        (prize.maxWinners < 1 || !Number.isInteger(prize.maxWinners))
      ) {
        errors[`prize_${index}_maxWinners`] = `Prize ${
          index + 1
        } must allow at least 1 winner`;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Project Data
 *
 * Validates project form data before submission.
 * Checks required fields, URL formats, and team member data.
 *
 * @param project - Partial project data to validate
 * @returns ValidationResult with isValid flag and errors object
 */
export function validateProject(project: Partial<Project>): ValidationResult {
  const errors: Record<string, string> = {};

  // Required field validations
  if (!project.name?.trim()) {
    errors.name = "Project name is required";
  }

  if (!project.description?.trim()) {
    errors.description = "Description is required";
  }

  // Optional GitHub URL validation
  if (
    project.githubUrl &&
    project.githubUrl.trim() &&
    !isValidUrl(project.githubUrl)
  ) {
    errors.githubUrl = "Invalid GitHub URL format";
  }

  if (!project.eventId?.trim()) {
    errors.eventId = "Event selection is required";
  }

  // Optional demo URL validation
  if (
    project.demoUrl &&
    project.demoUrl.trim() &&
    !isValidUrl(project.demoUrl)
  ) {
    errors.demoUrl = "Invalid demo URL format";
  }

  // Technologies validation (at least one required)
  if (!project.technologies || project.technologies.length === 0) {
    errors.technologies = "At least one technology is required";
  }

  // Team members validation (at least one required)
  if (!project.teamMembers || project.teamMembers.length === 0) {
    errors.teamMembers = "At least one team member is required";
  } else {
    project.teamMembers.forEach((member, index) => {
      if (!member.name?.trim()) {
        errors[`team_${index}_name`] = `Team member ${
          index + 1
        } name is required`;
      }
      if (!member.role?.trim()) {
        errors[`team_${index}_role`] = `Team member ${
          index + 1
        } role is required`;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
