"use client";

import {
  Bell,
  BookOpen,
  Building2,
  Calendar,
  Compass,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  MessageSquare,
  PenSquare,
  School,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  VenetianMask,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { DrawerLink, DrawerPanel, DrawerSection } from "@/components/navigation/drawer-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { UserProfile } from "@/db/schema";
import { cn, getCollegeShortName } from "@/lib/utils";

type AnonMode = "ALL" | "NON_ANONYMOUS";

const SECTIONS = [
  {
    title: "Home",
    items: [
      { href: "/feeds", label: "Feed", icon: Home },
      { href: "/explore", label: "Explore", icon: Compass },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/chat", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    title: "Campus",
    items: [
      { href: "/campus", label: "Campus Hub", icon: Building2 },
      { href: "/communities", label: "Communities", icon: Users },
      { href: "/events", label: "Events", icon: Calendar },
      { href: "/confessions", label: "Confessions", icon: VenetianMask },
      { href: "/colleges", label: "Colleges", icon: School },
    ],
  },
  {
    title: "Learn & Play",
    items: [
      { href: "/academics", label: "Academics", icon: GraduationCap },
      { href: "/articles", label: "Articles", icon: BookOpen },
      { href: "/gaming", label: "Gaming", icon: Gamepad2 },
    ],
  },
  {
    title: "Connect & Shop",
    items: [
      { href: "/matching", label: "Matching", icon: Heart },
      { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/feeds") return pathname === "/feeds";
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
      className="flex items-center gap-3 rounded-2xl p-1 -m-1 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Avatar className="size-12 shrink-0">
        <AvatarImage src={profile.avatarUrl || ""} alt="" />
        <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
          {profile.displayName[0]}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[15px] font-bold leading-tight text-foreground">
          <span className="truncate">{profile.displayName}</span>
          {profile.onboardingCompleted && <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified" />}
        </p>
        <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
            <Zap className="size-3" aria-hidden />
            {profile.points || 0} LP
          </span>
          {campus && <span className="truncate text-muted-foreground">{campus}</span>}
        </div>
      </div>
    </Link>
  ) : (
    <BrandLogo href="/feeds" size="md" />
  );

  const footer = (
    <div className="space-y-0.5">
      <DrawerLink href="/settings" label="Settings & Privacy" icon={Settings} active={isActive(pathname, "/settings")} onNavigate={onClose} />
      {isAdmin && <DrawerLink href="/admin" label="Admin Console" icon={ShieldCheck} tone="primary" onNavigate={onClose} />}
      <div className="flex min-h-11 items-center justify-between px-3">
        <span className="text-sm font-medium text-foreground">Appearance</span>
        <ThemeToggle />
      </div>
      {profile && (
        <SignOutButton className="mt-1 h-11 w-full justify-center rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10" />
      )}
    </div>
  );

  return (
    <DrawerPanel open={open} onClose={onClose} label="Main menu" header={header} footer={footer}>
      {!profile && (
        <Link
          href="/sign-in"
          onClick={onClose}
          className="mb-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Sparkles className="size-4" aria-hidden />
          Sign in or join your campus
        </Link>
      )}

      {/* Quick actions: the two things people open the menu for most */}
      <div className="grid grid-cols-2 gap-2 px-1">
        {!isViewer && profile && (
          <Link
            href="/post/new"
            onClick={onClose}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <PenSquare className="size-4" aria-hidden />
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
            "flex h-11 items-center justify-center gap-2 rounded-xl bg-muted/70 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
            (isViewer || !profile) && "col-span-2"
          )}
        >
          <Search className="size-4" aria-hidden />
          Search
        </button>
      </div>

      {SECTIONS.map((section) => (
        <DrawerSection key={section.title} title={section.title}>
          {section.items.map((item) => (
            <DrawerLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(pathname, item.href)}
              onNavigate={onClose}
              badge={
                item.href === "/notifications" && unreadCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : undefined
              }
            />
          ))}
        </DrawerSection>
      ))}

      {/* Feed anonymity filter (AGENTS.md section 6) */}
      <DrawerSection title="Feed shows">
        <div className="mx-1 grid grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1" role="radiogroup" aria-label="Feed anonymity filter">
          {(
            [
              { mode: "ALL", label: "All & Anon", icon: VenetianMask },
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
                "flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
                anonMode === mode ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </DrawerSection>
    </DrawerPanel>
  );
}
