/**
 * Public profile fields chat payloads may carry (thread header, message
 * sender, info drawer). Email, date of birth, phone and dating data stay out.
 */
export const CHAT_USER_COLUMNS = {
  id: true,
  userId: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  institutionId: true,
  course: true,
  branch: true,
  year: true,
  points: true,
  lastSeenAt: true,
  isCollegeVerified: true,
} as const;
