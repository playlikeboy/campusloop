"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/use-profile";
import { hasAuthCookie } from "@/lib/auth-cookie";
import type { ShellProfile } from "@/lib/server-cache";

/** Mirrors VIEWER_INSTITUTION_SLUG in src/lib/viewer.ts (server-only module). */
const VIEWER_INSTITUTION_SLUG = "viewer-hub";

export interface ClientShellState {
  profile?: ShellProfile;
  collegeName?: string;
  isAdmin?: boolean;
  isViewer?: boolean;
}

/**
 * Some public pages (/courses, CS50 and category pages) are served as static
 * signed-out snapshots, so the server never passes a profile. When the server gave
 * none but a session cookie exists, load the profile in the browser instead.
 */
export function useClientShellProfile(server: ClientShellState): ClientShellState {
  const [hasSession, setHasSession] = useState(false);
  const needsClient = !server.profile;

  useEffect(() => {
    if (needsClient) setHasSession(hasAuthCookie());
  }, [needsClient]);

  const { profile } = useProfile({ enabled: needsClient && hasSession });

  if (!needsClient || !profile?.onboardingCompleted) return server;

  const isViewer = profile.institution?.slug === VIEWER_INSTITUTION_SLUG;
  return {
    profile: {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      points: profile.points ?? profile.loopPoints ?? 0,
      onboardingCompleted: true,
      feedVisibility: (profile.feedVisibility ?? "ALL") as ShellProfile["feedVisibility"],
      role: (profile.role ?? "STUDENT") as ShellProfile["role"],
    },
    collegeName: isViewer ? "Viewer Mode" : (profile.institution?.name ?? undefined),
    isAdmin: profile.role === "ADMIN",
    isViewer,
  };
}
