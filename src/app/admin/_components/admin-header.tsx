"use client";

import {
  Command,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Shield,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AdminGlobalSearch } from "./admin-global-search";

interface AdminHeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileDrawer: () => void;
  adminProfile?: {
    displayName?: string | null;
    username?: string | null;
    email?: string | null;
    role?: string | null;
    avatarUrl?: string | null;
  } | null;
  pendingReviewCount?: number;
}

export function AdminHeader({
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenMobileDrawer,
  adminProfile,
  pendingReviewCount = 0,
}: AdminHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isProduction = process.env.NODE_ENV === "production";

  // Global keyboard shortcut to open search modal ('/' or 'Cmd+K' / 'Ctrl+K')
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-13 border-b border-border/60 bg-card/85 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Left Section: Sidebar Toggle & Environment Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={onOpenMobileDrawer}
            className="md:hidden -ml-1 flex size-10 items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors cursor-pointer active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Open admin menu"
          >
            <Menu className="size-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden md:flex size-8 items-center justify-center rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>

          {/* App Title for mobile / collapsed desktop */}
          <Link
            href="/admin"
            className="flex items-center gap-2 font-bold tracking-tight text-foreground text-sm shrink-0"
          >
            <span className="hidden sm:inline">CampusLoop</span>
            <span className="text-muted-foreground font-normal hidden sm:inline">/</span>
            <span className="font-semibold text-xs sm:text-sm">Admin</span>
          </Link>

          {/* Environment Indicator Pill */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0",
              isProduction
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
            )}
            title={
              isProduction
                ? "Operating on Production Cloudflare Edge Network (campusloop.space)"
                : "Operating in Development/Staging Environment"
            }
          >
            <span
              className={cn(
                "size-1.5 rounded-full animate-pulse",
                isProduction ? "bg-emerald-500" : "bg-amber-500"
              )}
            />
            <span>{isProduction ? "Production" : "Staging"}</span>
          </div>
        </div>

        {/* Center / Right Section: Global Search, Quick Alert, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Global Search Input Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 h-8 px-2.5 sm:px-3 rounded-lg bg-muted/40 hover:bg-muted/80 border border-border/50 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer"
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Search console...</span>
            <span className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-background/60 border border-border/40 font-mono text-[9px] text-muted-foreground">
              <Command className="size-2.5 inline" />K
            </span>
          </button>

          {/* Quick Review / Alerts Link */}
          <Link
            href="/admin/review"
            className="relative flex size-8 items-center justify-center rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
            title={`${pendingReviewCount} items in review queue`}
          >
            <ShieldAlert className="size-4" />
            {pendingReviewCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-pulse">
                {pendingReviewCount > 9 ? "9+" : pendingReviewCount}
              </span>
            )}
          </Link>

          {/* Admin Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-border/40">
            <div className="size-7 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-bold uppercase shrink-0">
              {adminProfile?.displayName?.charAt(0) || "A"}
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                {adminProfile?.displayName || "Admin"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                @{adminProfile?.username || "root"}
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              <Shield className="size-2.5" />
              <span>{adminProfile?.role || "ADMIN"}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <AdminGlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
