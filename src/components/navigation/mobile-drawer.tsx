"use client";

import { Coins, Plus, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { DrawerLink, DrawerPanel, DrawerSection } from "@/components/navigation/drawer-panel";
import { formatCount, isPathActive, profileHref } from "@/components/shells/nav-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { DRAWER_SECTIONS, ROUTES } from "@/constants/navigation";
import type { UserProfile } from "@/db/schema";
import { cn, getAvatarUrl, getCollegeShortName } from "@/lib/utils";

type AnonMode = "ALL" | "NON_ANONYMOUS";

const ANON_OPTIONS: { value: AnonMode; label: string }[] = [
  { value: "ALL", label: "Everyone" },
  { value: "NON_ANONYMOUS", label: "Named only" },
];

export interface MobileDrawerProps {
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
}

/** Mobile menu: who you are, Post + Search, then every nav group from NAV_GROUPS. No promo badges. */
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
}: MobileDrawerProps) {
  const campus =
    collegeName && collegeName !== "Viewer Mode"
      ? getCollegeShortName({ name: collegeName }) || collegeName
      : null;
  const ownProfileHref = profileHref(profile?.username);

  const header = profile ? (
    <Link
      href={ownProfileHref}
      onClick={onClose}
      className="-m-1 flex items-center gap-3 rounded-lg p-1 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          {profile.onboardingCompleted && <VerifiedBadge size="sm" />}
        </p>
        <p className="truncate text-sm text-fg-muted">@{profile.username}</p>
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-reward px-2 font-semibold tabular-nums text-reward-fg">
            <Coins className="size-3.5" aria-hidden="true" />
            {profile.points || 0} LP
          </span>
          {campus && <span className="truncate text-fg-muted">{campus}</span>}
        </div>
      </div>
    </Link>
  ) : (
    <BrandLogo href={ROUTES.home} size="md" />
  );

  const footer = (
    <div className="space-y-0.5">
      {isAdmin && <DrawerLink href="/admin" label="Admin" icon={ShieldCheck} onNavigate={onClose} />}
      <div className="flex min-h-11 items-center justify-between px-3">
        <span className="text-sm font-medium text-fg">Dark mode</span>
        <ThemeToggle />
      </div>
      {profile && (
        <SignOutButton className="mt-1 w-full text-danger hover:bg-danger-subtle" />
      )}
    </div>
  );

  return (
    <DrawerPanel open={open} onClose={onClose} label="Menu" header={header} footer={footer}>
      {!profile && (
        <Link
          href="/sign-up"
          onClick={onClose}
          className="mb-3 flex h-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-fg transition-ui hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Join with college email
        </Link>
      )}

      <div className="grid grid-cols-2 gap-2 px-1">
        {!isViewer && profile && (
          <Link
            href={ROUTES.newPost}
            onClick={onClose}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-brand-fg transition-ui hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
            Post
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSearch();
          }}
          className={cn(
            "flex h-11 items-center justify-center gap-2 rounded-full bg-surface-muted text-sm font-medium text-fg transition-ui hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
            if (isViewer && item.href === ROUTES.chat) return null;
            const href = item.href === ROUTES.profile ? ownProfileHref : item.href;
            const showUnread = item.href === ROUTES.notifications && unreadCount > 0;
            return (
              <DrawerLink
                key={item.href}
                href={href}
                label={item.label}
                icon={item.icon}
                external={item.external}
                active={isPathActive(pathname, href)}
                onNavigate={onClose}
                badge={
                  showUnread ? (
                    <span
                      className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold tabular-nums text-brand-fg"
                      aria-label={`${unreadCount} unread`}
                    >
                      {formatCount(unreadCount)}
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </DrawerSection>
      ))}

      <DrawerSection title="Show posts from">
        <SegmentedControl
          options={ANON_OPTIONS}
          value={anonMode}
          onChange={onAnonModeChange}
          fullWidth
          size="sm"
          aria-label="Show posts from"
          className="mx-1"
        />
      </DrawerSection>
    </DrawerPanel>
  );
}
