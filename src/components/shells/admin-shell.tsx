"use client";

import { ArrowLeft, Ghost, Menu, PanelLeftClose, PanelLeftOpen, Search, Shield, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminGlobalSearch } from "@/app/admin/_components/admin-global-search";
import { AdminMobileDrawer } from "@/app/admin/_components/admin-mobile-drawer";
import { ADMIN_NAV_SECTIONS } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import { formatCount } from "./nav-utils";

export { ADMIN_NAV_SECTIONS };

export interface AdminProfileSummary {
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
}

export interface AdminShellProps {
  children: React.ReactNode;
  adminProfile?: AdminProfileSummary | null;
  pendingReviewCount?: number;
}

function isAdminItemActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname() || "/admin";

  return (
    <aside
      aria-label="Admin sidebar"
      className={cn(
        "no-scrollbar sticky top-0 hidden h-dvh shrink-0 flex-col justify-between overflow-y-auto border-r border-border bg-surface md:flex",
        collapsed ? "w-16 px-2 py-4" : "w-[var(--nav-desktop-w)] px-3 py-4"
      )}
    >
      <div className="space-y-5">
        <Link
          href="/admin"
          className={cn(
            "flex min-h-11 items-center gap-2.5 rounded-md px-2 font-semibold text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            collapsed && "justify-center px-0"
          )}
          aria-label={collapsed ? "Admin inbox" : undefined}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
            <Shield className="size-4" aria-hidden="true" />
          </span>
          {!collapsed && (
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">CampusLoop</span>
              <span className="text-xs font-medium text-fg-muted">Admin console</span>
            </span>
          )}
        </Link>

        <nav aria-label="Admin" className="space-y-4">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-0.5">
              {!collapsed && <p className="px-2.5 pb-1 text-xs font-semibold text-fg-subtle">{section.title}</p>}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isAdminItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      collapsed ? "mx-auto size-10 justify-center" : "gap-2.5 px-2.5",
                      active ? "bg-brand-subtle text-brand-text" : "text-fg-muted hover:bg-surface-muted hover:text-fg"
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-3">
        <Link
          href="/feeds"
          title={collapsed ? "Back to CampusLoop" : undefined}
          aria-label={collapsed ? "Back to CampusLoop" : undefined}
          className={cn(
            "flex min-h-10 items-center rounded-md text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            collapsed ? "mx-auto size-10 justify-center" : "gap-2 px-2.5"
          )}
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Back to CampusLoop</span>}
        </Link>
        {!collapsed && (
          <p className="flex items-center gap-1.5 px-2 text-xs leading-tight text-fg-subtle">
            <Ghost className="size-3 shrink-0" aria-hidden="true" />
            <span>Identity reveals are audit-logged</span>
          </p>
        )}
      </div>
    </aside>
  );
}

interface AdminHeaderProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileDrawer: () => void;
  adminProfile?: AdminProfileSummary | null;
  pendingReviewCount?: number;
}

export function AdminHeader({
  collapsed,
  onToggleSidebar,
  onOpenMobileDrawer,
  adminProfile,
  pendingReviewCount = 0,
}: AdminHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const isProduction = process.env.NODE_ENV === "production";

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const iconButton =
    "flex size-10 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <>
      <header className="sticky top-0 z-[var(--z-sticky-nav)] flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/95 px-[var(--gutter)] backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={onOpenMobileDrawer} className={cn(iconButton, "-ml-2 md:hidden")} aria-label="Open admin menu">
            <Menu className="size-5" />
          </button>
          <button
            type="button"
            onClick={onToggleSidebar}
            className={cn(iconButton, "hidden md:flex")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
          <Link href="/admin" className="truncate text-sm font-semibold text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Admin
          </Link>
          <span
            className={cn(
              "inline-flex h-6 items-center rounded-full px-2 text-xs font-medium",
              isProduction ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"
            )}
            title={isProduction ? "Production" : "Development or staging"}
          >
            {isProduction ? "Production" : "Staging"}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-10 items-center gap-2 rounded-md border border-border bg-surface-muted px-3 text-sm text-fg-muted hover:border-border-strong hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Search the admin console"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded-sm border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-fg-subtle md:inline">
              Ctrl K
            </kbd>
          </button>

          <Link
            href="/admin"
            className={cn(iconButton, "relative")}
            aria-label={`${pendingReviewCount} items waiting in the inbox`}
          >
            <ShieldAlert className="size-4" aria-hidden="true" />
            {pendingReviewCount > 0 && (
              <span
                className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.625rem] font-semibold tabular-nums leading-none text-danger-fg"
                aria-hidden="true"
              >
                {formatCount(pendingReviewCount)}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2 border-l border-border pl-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold uppercase text-brand-text">
              {adminProfile?.displayName?.charAt(0) || "A"}
            </span>
            <span className="hidden flex-col leading-tight lg:flex">
              <span className="max-w-32 truncate text-xs font-semibold text-fg">{adminProfile?.displayName || "Admin"}</span>
              <span className="max-w-32 truncate text-xs text-fg-muted">{adminProfile?.role || "ADMIN"}</span>
            </span>
          </div>
        </div>
      </header>

      <AdminGlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export function AdminShell({ children, adminProfile, pendingReviewCount = 0 }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Tablets get the rail collapsed; desktops expanded.
  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 1024 && window.innerWidth >= 768) setCollapsed(true);
      else if (window.innerWidth >= 1024) setCollapsed(false);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-fg"
      >
        Skip to main content
      </a>
      <AdminSidebar collapsed={collapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((v) => !v)}
          onOpenMobileDrawer={() => setDrawerOpen(true)}
          adminProfile={adminProfile}
          pendingReviewCount={pendingReviewCount}
        />
        <main id="main" className="mx-auto w-full max-w-[var(--container)] flex-1 px-[var(--gutter)] py-6">
          {children}
        </main>
      </div>

      <AdminMobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        adminName={adminProfile?.displayName}
        pendingReviewCount={pendingReviewCount}
      />
    </div>
  );
}
