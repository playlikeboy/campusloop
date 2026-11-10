export interface SecretCrushItem {
  id: string;
  targetId: string;
  target: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    branch?: string | null;
    year?: number | null;
  };
  isMutual: boolean;
  matchedAt?: string | null;
  createdAt: string;
}

/** Shape of GET /api/dating/crush. */
export interface SecretCrushResponse {
  crushes: SecretCrushItem[];
  usedSlots: number;
  maxSlots: number;
  remainingSlots: number;
  attemptsUsedIn7Days?: number;
  maxAttemptsIn7Days?: number;
  remainingAttemptsIn7Days?: number;
  receivedCrushesCount: number;
}

/** A row from /api/chat/search, trimmed to what the crush picker shows. */
export interface CrushSearchUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

/** "Year 2" for a study year, "Class of 2027" for a graduation year. */
export function formatStudyYear(year?: number | null): string | null {
  if (!year) return null;
  return year > 1000 ? `Class of ${year}` : `Year ${year}`;
}

export function initials(name?: string | null): string {
  return (name ?? "?").trim().slice(0, 2).toUpperCase() || "?";
}
