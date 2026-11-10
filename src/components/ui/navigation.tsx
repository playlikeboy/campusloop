"use client";

import { AppChrome } from "@/components/shells/app-shell";
import type { UserProfile } from "@/db/schema";

interface NavigationProps {
  profile?: UserProfile;
  collegeName?: string;
  isAdmin?: boolean;
  isViewer?: boolean;
  hideHeader?: boolean;
}

/**
 * Legacy entry point for pages that lay out their own content column next to the
 * chrome (`<div className="lg:flex"><Navigation /><div>…</div></div>`). New layouts
 * use `AppShell` from `@/components/shells/app-shell` instead.
 */
export function Navigation({ profile, collegeName, isAdmin, isViewer, hideHeader }: NavigationProps) {
  return (
    <AppChrome
      profile={profile}
      collegeName={collegeName}
      isAdmin={isAdmin}
      isViewer={isViewer}
      topBar={hideHeader ? "none" : "mobile"}
    />
  );
}
