/**
 * Shared validation utilities for User Profiles, Names, and Handles.
 */

export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

/**
 * Validates a student's full / display name.
 * Requirements:
 * - Must be 2-50 characters
 * - Must contain letters (supports international unicode letters)
 * - May contain spaces, apostrophes, dots, and hyphens
 * - Cannot be pure digits, pure symbols, or spam strings
 */
export function validateDisplayName(name: string | null | undefined): ValidationResult {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: "Display name is required." };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters long." };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: "Name cannot exceed 50 characters." };
  }

  // Check that it contains at least one letter
  if (!/\p{L}/u.test(trimmed)) {
    return { isValid: false, error: "Name must contain real letters." };
  }

  // Disallow invalid characters (only letters, spaces, hyphens, dots, apostrophes allowed)
  const validNameRegex = /^[\p{L}\s'.-]+$/u;
  if (!validNameRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "Name can only contain letters, spaces, hyphens, dots, and apostrophes.",
    };
  }

  // Reject consecutive special characters or spaces (e.g. "John...Doe", "A   B")
  if (/\s{2,}|[.\-']{2,}/.test(trimmed)) {
    return { isValid: false, error: "Name contains repetitive formatting or spaces." };
  }

  // Rule: None can name "tech" (or platform-reserved handles) as their name
  const lower = trimmed.toLowerCase();
  const words = lower.split(/[\s'.-]+/).filter(Boolean);

  if (
    lower === "tech" ||
    words.includes("tech") ||
    lower.includes("loop_tech") ||
    lower.includes("campusloop tech")
  ) {
    return {
      isValid: false,
      error: "The name 'tech' is reserved and cannot be used as your name.",
    };
  }

  const RESERVED_DISPLAY_NAMES = new Set([
    "admin",
    "administrator",
    "campusloop",
    "moderator",
    "official",
    "support",
    "system",
  ]);

  if (RESERVED_DISPLAY_NAMES.has(lower)) {
    return {
      isValid: false,
      error: `The name '${trimmed}' is reserved and cannot be used as your name.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates a campus handle / username.
 * Requirements:
 * - 3-30 characters
 * - Lowercase alphanumeric and underscores only
 * - Cannot claim reserved platform or desk handles like 'tech'
 */
export function validateUsername(username: string | null | undefined): ValidationResult {
  if (!username || typeof username !== "string") {
    return { isValid: false, error: "Username is required." };
  }

  const trimmed = username.trim().toLowerCase();

  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters." };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: "Username cannot exceed 30 characters." };
  }

  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: "Username can only contain lowercase letters, numbers, and underscores.",
    };
  }

  // Rule: None can name "tech" as their handle / username
  if (
    trimmed === "tech" ||
    trimmed === "loop_tech" ||
    trimmed === "campusloop_tech" ||
    trimmed === "tech_desk"
  ) {
    return {
      isValid: false,
      error: "The username 'tech' is reserved and cannot be claimed.",
    };
  }

  return { isValid: true };
}
