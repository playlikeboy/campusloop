"use client";

import { PenSquare, Search, Settings, ShieldCheck, VenetianMask } from "lucide-react";
import Link from "next/link";
import { DrawerLink, DrawerPanel, DrawerSection } from "@/components/navigation/drawer-panel";
import { NavBadge } from "@/components/shells/nav-badge";
import { formatCount, isPathActive } from "@/components/shells/nav-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DRAWER_SECTIONS } from "@/constants/navigation";
import type { UserProfile } from "@/db/schema";
import { cn, getAvatarUrl, getCollegeShortName } from "@/lib/utils";

type AnonMode = "ALL" | "NON_ANONYMOUS";

export function MobileDrawer({
  open,
  onClose,
  pathname,
  profile,
  collegeName,
  isAdmin,
  isViewer,
  unreadCount,
  anonMode,
  onAnonModeChange,
  onOpenSearch,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  profile?: UserProfile;
  collegeName?: string;
  isAdmin?: boolean;
  isViewer?: boolean;
  unreadCount: number;
  anonMode: AnonMode;
  onAnonModeChange: (mode: AnonMode) => void;
  onOpenSearch: () => void;
}) {
  const campus =
    collegeName && collegeName !== "Viewer Mode" ? getCollegeShortName({ name: collegeName }) || collegeName : null;

  const header = profile ? (
    <Link
      href={`/@${profile.username}`}
      onClick={onClose}
      className="-m-1 flex items-center gap-3 rounded-md p-1 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Avatar className="size-12 shrink-0">
        <AvatarImage src={getAvatarUrl(profile.avatarUrl, profile.username)} alt="" />
        <AvatarFallback className="bg-surface-muted text-base font-semibold text-fg">
          {profile.displayName?.[0] || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-base font-semibold leading-tight text-fg">
          <span className="truncate">{profile.displayName}</span>
          {profile.onboardingCompleted && (
            <ShieldCheck className="size-4 shrink-0 text-brand-text" aria-label="Verified" />
          )}
        </p>
        <p className="truncate text-xs text-fg-muted">@{profile.username}</p>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <NavBadge tone="reward">{profile.points || 0} LP</NavBadge>
          {campus && <span className="truncate text-fg-muted">{campus}</span>}
        </div>
      </div>
    </Link>
  ) : (
    <BrandLogo href="/feeds" size="md" />
  );

  const footer = (
    <div className="space-y-0.5">
      <DrawerLink
        href="/settings"
        label="Settings and privacy"
        icon={Settings}
        active={isPathActive(pathname, "/settings")}
        onNavigate={onClose}
      />
      {isAdmin && <DrawerLink href="/admin" label="Admin console" icon={ShieldCheck} tone="primary" onNavigate={onClose} />}
      <div className="flex min-h-11 items-center justify-between px-3">
        <span className="text-sm font-medium text-fg">Appearance</span>
        <ThemeToggle />
      </div>
      {profile && (
        <SignOutButton className="mt-1 h-11 w-full justify-center rounded-md border-border text-sm font-medium text-danger hover:bg-danger-subtle" />
      )}
    </div>
  );

  return (
    <DrawerPanel open={open} onClose={onClose} label="Menu" header={header} footer={footer}>
      {!profile && (
        <Link
          href="/sign-in"
          onClick={onClose}
          className="mb-3 flex h-11 items-center justify-center gap-2 rounded-md bg-brand text-sm font-semibold text-brand-fg hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Sign in or join your campus
        </Link>
      )}

      <div className="grid grid-cols-2 gap-2 px-1">
        {!isViewer && profile && (
          <Link
            href="/post/new"
            onClick={onClose}
            className="flex h-11 items-center justify-center gap-2 rounded-md bg-brand text-sm font-semibold text-brand-fg hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <PenSquare className="size-4" aria-hidden="true" />
            New post
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSearch();
          }}
          className={cn(
            "flex h-11 items-center justify-center gap-2 rounded-md bg-surface-muted text-sm font-medium text-fg hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            (isViewer || !profile) && "col-span-2"
          )}
        >
          <Search className="size-4" aria-hidden="true" />
          Search
        </button>
      </div>

      {DRAWER_SECTIONS.map((section) => (
        <DrawerSection key={section.group} title={section.group}>
          {section.items.map((item) => {
            if (isViewer && item.href === "/chat") return null;
            return (
              <DrawerLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                external={item.external}
                active={isPathActive(pathname, item.href)}
                onNavigate={onClose}
                badge={
                  item.href === "/notifications" && unreadCount > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold tabular-nums text-brand-fg">
                      {formatCount(unreadCount)}
                    </span>
                  ) : item.badge ? (
                    <NavBadge tone={item.badgeTone}>{item.badge}</NavBadge>
                  ) : undefined
                }
              />
            );
          })}
        </DrawerSection>
      ))}

      <DrawerSection title="Feed shows">
        <div
          className="mx-1 grid grid-cols-2 gap-1 rounded-md bg-surface-muted p-1"
          role="radiogroup"
          aria-label="Feed anonymity filter"
        >
          {(
            [
              { mode: "ALL", label: "All and anon", icon: VenetianMask },
              { mode: "NON_ANONYMOUS", label: "Public only", icon: ShieldCheck },
            ] as const
          ).map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={anonMode === mode}
              onClick={() => onAnonModeChange(mode)}
              className={cn(
                "flex h-9 items-center justify-center gap-1.5 rounded-sm text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                anonMode === mode ? "bg-surface text-fg shadow-xs" : "text-fg-muted hover:text-fg"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </DrawerSection>
    </DrawerPanel>
  );
}
