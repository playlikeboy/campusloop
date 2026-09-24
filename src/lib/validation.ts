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

  return { isValid: true };
}

/**
 * Validates a campus handle / username.
 * Requirements:
 * - 3-30 characters
 * - Lowercase alphanumeric and underscores only
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

  return { isValid: true };
}


export const CREATE_POST_TYPES = [
  "NORMAL",
  "CONFESSION",
  "POLL",
  "QUESTION",
  "MEME",
  "EVENT",
  "LOST_FOUND",
] as const;

export const CREATE_POST_SCOPES = ["CAMPUS", "GLOBAL"] as const;

export type CreatePostType = (typeof CREATE_POST_TYPES)[number];
export type CreatePostScope = (typeof CREATE_POST_SCOPES)[number];

export type CreatePostInput = {
  body: string;
  type: CreatePostType;
  scope: CreatePostScope;
  isAnonymous: boolean;
  title?: string;
  options?: string[];
  communityId?: string;
};

export type CreatePostPayloadResult =
  | { isValid: true; data: CreatePostInput }
  | { isValid: false; error: string };

/**
 * Parses and normalizes the public POST /api/posts payload at the server boundary.
 * This prevents malformed JSON or wrong runtime types from reaching route logic as 500s.
 */
export function parseCreatePostPayload(payload: unknown): CreatePostPayloadResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { isValid: false, error: "Invalid post payload." };
  }

  const input = payload as Record<string, unknown>;
  if (typeof input.body !== "string") {
    return { isValid: false, error: "Post body is required." };
  }

  const body = input.body.trim();
  if (body.length === 0) {
    return { isValid: false, error: "Post body cannot be empty." };
  }
  if (body.length > 20_000) {
    return { isValid: false, error: "Post body cannot exceed 20,000 characters." };
  }

  const type = input.type === undefined ? "NORMAL" : input.type;
  if (typeof type !== "string" || !CREATE_POST_TYPES.includes(type as CreatePostType)) {
    return { isValid: false, error: "Unsupported post type." };
  }

  const scope = input.scope === undefined ? "GLOBAL" : input.scope;
  if (typeof scope !== "string" || !CREATE_POST_SCOPES.includes(scope as CreatePostScope)) {
    return { isValid: false, error: "Unsupported post scope." };
  }

  const isAnonymous = input.isAnonymous === undefined ? false : input.isAnonymous;
  if (typeof isAnonymous !== "boolean") {
    return { isValid: false, error: "Anonymous mode must be a boolean." };
  }

  let title: string | undefined;
  if (input.title !== undefined && input.title !== null) {
    if (typeof input.title !== "string") {
      return { isValid: false, error: "Post title must be text." };
    }
    title = input.title.trim();
    if (title.length > 200) {
      return { isValid: false, error: "Post title cannot exceed 200 characters." };
    }
  }

  let options: string[] | undefined;
  if (input.options !== undefined) {
    if (!Array.isArray(input.options)) {
      return { isValid: false, error: "Poll options must be an array." };
    }
    if (input.options.length > 10) {
      return { isValid: false, error: "A poll can have at most 10 options." };
    }
    options = [];
    for (const option of input.options) {
      if (typeof option !== "string") {
        return { isValid: false, error: "Poll options must be text." };
      }
      const normalized = option.trim();
      if (!normalized) continue;
      if (normalized.length > 100) {
        return { isValid: false, error: "Each poll option cannot exceed 100 characters." };
      }
      options.push(normalized);
    }
  }

  let communityId: string | undefined;
  if (input.communityId !== undefined && input.communityId !== null) {
    if (typeof input.communityId !== "string" || input.communityId.trim().length === 0) {
      return { isValid: false, error: "Community id must be a non-empty string." };
    }
    communityId = input.communityId.trim();
    if (communityId.length > 200) {
      return { isValid: false, error: "Community id is too long." };
    }
  }

  return {
    isValid: true,
    data: {
      body,
      type: type as CreatePostType,
      scope: scope as CreatePostScope,
      isAnonymous,
      ...(title ? { title } : {}),
      ...(options ? { options } : {}),
      ...(communityId ? { communityId } : {}),
    },
  };
}
