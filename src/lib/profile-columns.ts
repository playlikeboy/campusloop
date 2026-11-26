/**
 * Drizzle `columns` selection for a user profile that is joined onto content
 * other people see (post and comment authors, search results, uploaders,
 * community creators).
 *
 * Exclusion list, so every display field the UI already reads keeps working,
 * while the private ones never leave the server:
 * - `anonymousUsername` is the pseudonym stamped on that student's anonymous
 *   posts and comments, so shipping it next to their name links them to every
 *   anonymous thing they wrote.
 * - `email`, `dob`, `gender`, `datingPreferences`, `targetInstitutionIds`
 *   are personal data.
 * - `userId` (auth provider id), `referredById` and `githubUserId` are internal.
 *
 * Usage: `with: { author: { columns: PUBLIC_PROFILE_COLUMNS } }`.
 */
export const PUBLIC_PROFILE_COLUMNS = {
  userId: false,
  email: false,
  gender: false,
  dob: false,
  datingPreferences: false,
  targetInstitutionIds: false,
  anonymousUsername: false,
  referredById: false,
  githubUserId: false,
} as const;
