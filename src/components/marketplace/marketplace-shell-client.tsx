"use client";

import { AppShell } from "@/components/shells/app-shell";
import type { UserProfile } from "@/db/schema";
import { MarketplaceSubNav } from "./marketplace-sub-nav";

type MarketplaceProfile = UserProfile & { institution?: { name?: string | null } | null };

interface MarketplaceShellClientProps {
  children: React.ReactNode;
  profile: MarketplaceProfile | null | undefined;
  viewerMode: boolean;
}

/** Marketplace uses the same app chrome as the rest of CampusLoop, plus a section tab row. */
export function MarketplaceShellClient({ children, profile, viewerMode }: MarketplaceShellClientProps) {
  const collegeName = viewerMode ? "Viewer Mode" : (profile?.institution?.name ?? "Campus");

  return (
    <AppShell
      profile={profile ?? undefined}
      collegeName={collegeName}
      isAdmin={profile?.role === "ADMIN"}
      isViewer={viewerMode}
    >
      <MarketplaceSubNav />
      {children}
    </AppShell>
  );
}
