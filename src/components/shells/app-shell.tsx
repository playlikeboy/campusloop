"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MobileDrawer } from "@/components/navigation/mobile-drawer";
import { PreviewModeBanner } from "@/components/preview/preview-mode-banner";
import { GlobalSearchModal } from "@/components/search/global-search-modal";
import type { UserProfile } from "@/db/schema";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { AppBottomNav } from "./app-bottom-nav";
import { AppSidebar } from "./app-sidebar";
import { AppTopBar } from "./app-top-bar";

type AnonMode = "ALL" | "NON_ANONYMOUS";

export interface AppChromeProps {
  profile?: UserProfile;
  collegeName?: string;
  isAdmin?: boolean;
  isViewer?: boolean;
  /**
   * "full": top bar at every width (AppShell default).
   * "mobile": top bar below lg only, for legacy pages that lay out their own desktop column.
   * "none": full-screen flows (chat, post deck) that own their header.
   */
  topBar?: "full" | "mobile" | "none";
  /** Rendered inside the content column, after the top bar. */
  children?: React.ReactNode;
}

export interface AppShellProps extends Omit<AppChromeProps, "topBar" | "children"> {
  children: React.ReactNode;
  /** Optional right rail shown at >= 1280px beside the content column. */
  contextRail?: React.ReactNode;
  /** Full-screen flows (chat, post deck) that own their header: no top bar, no content padding. */
  fullBleed?: boolean;
}

/**
 * Chrome: desktop sidebar, top bar, mobile drawer, bottom tab bar and the search palette.
 * Renders as `sidebar + [column: top bar + children]` inside the parent's flex row.
 */
export function AppChrome({ profile, collegeName, isAdmin, isViewer, topBar = "full", children }: AppChromeProps) {
  const pathname = usePathname() || "/feeds";
  const unreadCount = useUnreadNotificationsCount();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [anonMode, setAnonMode] = useState<AnonMode>("ALL");
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        sounds.tap();
        haptics.light();
        setSearchOpen(true);
      }
    };
    const onOpenPalette = () => setSearchOpen(true);
    // Other surfaces dispatch these events instead of importing the shell.
    const onOpenDrawer = () => {
      if (window.matchMedia("(max-width: 1023px)").matches) setDrawerOpen(true);
    };
    const onCloseDrawer = () => setDrawerOpen(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("campusloop_open_search_palette", onOpenPalette);
    window.addEventListener("campusloop_open_mobile_drawer", onOpenDrawer);
    window.addEventListener("campusloop_close_mobile_drawer", onCloseDrawer);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("campusloop_open_search_palette", onOpenPalette);
      window.removeEventListener("campusloop_open_mobile_drawer", onOpenDrawer);
      window.removeEventListener("campusloop_close_mobile_drawer", onCloseDrawer);
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("campusloop_feed_visibility");
      if (saved === "NON_ANONYMOUS" || saved === "ALL") {
        setAnonMode(saved);
        return;
      }
    } catch {}
    if (profile?.feedVisibility === "NON_ANONYMOUS" || profile?.feedVisibility === "ALL") {
      setAnonMode(profile.feedVisibility);
    }
  }, [profile?.feedVisibility]);

  const changeAnonMode = useCallback((mode: AnonMode) => {
    setAnonMode(mode);
    try {
      localStorage.setItem("campusloop_feed_visibility", mode);
    } catch {}
    window.dispatchEvent(new CustomEvent("campusloop_feed_visibility_change", { detail: mode }));
    fetch("/api/profile/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedVisibility: mode }),
    }).catch(() => {});
    sounds.tap();
    haptics.light();
  }, []);

  const topBarNode =
    topBar === "none" ? null : (
      <div className={cn(topBar === "mobile" && "lg:hidden")}>
        <AppTopBar
          profile={profile}
          collegeName={collegeName}
          isAdmin={isAdmin}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenSearch={openSearch}
        />
      </div>
    );

  return (
    <>
      <AppSidebar profile={profile} isAdmin={isAdmin} isViewer={isViewer} />
      {children === undefined ? (
        topBarNode
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {topBarNode}
          {children}
        </div>
      )}
      <MobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        pathname={pathname}
        profile={profile}
        collegeName={collegeName}
        isAdmin={isAdmin}
        isViewer={isViewer}
        unreadCount={unreadCount}
        anonMode={anonMode}
        onAnonModeChange={changeAnonMode}
        onOpenSearch={openSearch}
      />
      <AppBottomNav restricted={isViewer || !profile} />
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export function AppShell({
  children,
  profile,
  collegeName,
  isAdmin,
  isViewer,
  contextRail,
  fullBleed,
}: AppShellProps) {
  return (
    <div className={cn("app-surface flex bg-bg text-fg", fullBleed ? "h-dvh overflow-hidden" : "min-h-dvh")}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-fg"
      >
        Skip to main content
      </a>
      <AppChrome
        profile={profile}
        collegeName={collegeName}
        isAdmin={isAdmin}
        isViewer={isViewer}
        topBar={fullBleed ? "none" : "full"}
      >
        {fullBleed ? (
          <main id="main" className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </main>
        ) : (
          <div className="mx-auto flex w-full max-w-[var(--container)] flex-1 gap-8 px-[var(--gutter)] pb-[calc(var(--nav-mobile-h)+env(safe-area-inset-bottom))] lg:pb-8">
            <main id="main" className="min-w-0 flex-1">
              {isViewer && <PreviewModeBanner />}
              {children}
            </main>
            {contextRail && (
              <aside aria-label="Related" className="hidden w-80 shrink-0 xl:block">
                {contextRail}
              </aside>
            )}
          </div>
        )}
      </AppChrome>
    </div>
  );
}
