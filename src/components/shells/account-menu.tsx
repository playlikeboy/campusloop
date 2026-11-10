"use client";

import { Settings, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { UserProfile } from "@/db/schema";
import { getAvatarUrl, initialOf } from "@/lib/utils";
import { navPress, profileHref } from "./nav-utils";

const itemClass =
  "flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium text-fg transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Desktop avatar button with a small account popover. Escape and outside click close it. */
export function AccountMenu({
  profile,
  campus,
  isAdmin,
}: {
  profile: UserProfile;
  campus?: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const avatar = getAvatarUrl(profile.avatarUrl, profile.username);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          navPress();
          setOpen((v) => !v);
        }}
        className="flex size-11 items-center justify-center rounded-full transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Your account"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar className="size-8">
          <AvatarImage src={avatar} alt="" />
          <AvatarFallback className="bg-surface-muted text-xs font-semibold text-fg">
            {initialOf(profile.displayName, "U")}
          </AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="sticker-pop absolute right-0 top-12 z-[var(--z-dropdown)] w-64 origin-top-right rounded-lg bg-surface-raised p-1.5 shadow-lg [--pop-from:2deg]"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-fg">{profile.displayName}</p>
            <p className="truncate text-xs text-fg-muted">@{profile.username}</p>
            {campus && <p className="mt-1 truncate text-xs text-fg-subtle">{campus}</p>}
          </div>
          <div className="my-1 border-t border-border" />
          <Link href={profileHref(profile.username)} role="menuitem" className={itemClass}>
            <User className="size-4 text-fg-muted" aria-hidden="true" />
            Your profile
          </Link>
          <Link href="/settings" role="menuitem" className={itemClass}>
            <Settings className="size-4 text-fg-muted" aria-hidden="true" />
            Settings
          </Link>
          {isAdmin && (
            <Link href="/admin" role="menuitem" className={itemClass}>
              <ShieldCheck className="size-4 text-fg-muted" aria-hidden="true" />
              Admin
            </Link>
          )}
          <div className="flex min-h-11 items-center justify-between px-3">
            <span className="text-sm font-medium text-fg">Dark mode</span>
            <ThemeToggle />
          </div>
          <div className="my-1 border-t border-border" />
          <SignOutButton variant="menu-item" />
        </div>
      )}
    </div>
  );
}
