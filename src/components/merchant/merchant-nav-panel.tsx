"use client";

import { ArrowLeft, Copy, ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { activeMerchantHref, type MerchantNavItem } from "./merchant-nav";
import { copyStoreLink, storePath } from "./merchant-utils";

interface MerchantNavPanelProps {
  items: MerchantNavItem[];
  pathname: string;
  verticalName: string;
  merchant?: { id: string; name: string; isOpen?: boolean | null } | null;
  profile: { displayName?: string | null; username?: string | null; avatarUrl?: string | null };
  onNavigate?: () => void;
  onLogout: () => void;
}

/** Sidebar body shared by the desktop rail and the mobile sheet. */
export function MerchantNavPanel({
  items,
  pathname,
  verticalName,
  merchant,
  profile,
  onNavigate,
  onLogout,
}: MerchantNavPanelProps) {
  const active = activeMerchantHref(items, pathname);

  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <nav aria-label="Store menu" className="space-y-1">
        <p className="px-3 pb-1 text-sm text-fg-muted">{verticalName}</p>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === active;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                sounds.tap();
                haptics.light();
                onNavigate?.();
              }}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-brand-subtle text-brand-text"
                  : "text-fg-muted hover:bg-surface-muted hover:text-fg"
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-border pt-4">
        {merchant && (
          <div className="space-y-2 px-1">
            <p className="truncate text-sm font-semibold text-fg">{merchant.name}</p>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href={storePath(merchant.id)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  View store
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Copy store link"
                onClick={() => {
                  sounds.tap();
                  void copyStoreLink(merchant.id);
                }}
              >
                <Copy />
              </Button>
            </div>
          </div>
        )}

        <Link
          href="/marketplace"
          onClick={onNavigate}
          className="flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          Back to CampusLoop
        </Link>

        <div className="flex items-center gap-3 px-1">
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-sm font-semibold">
              {profile.displayName?.[0]?.toUpperCase() || "S"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">{profile.displayName}</p>
            {profile.username && <p className="truncate text-sm text-fg-subtle">@{profile.username}</p>}
          </div>
          <Button variant="ghost" size="icon" aria-label="Log out" onClick={onLogout}>
            <LogOut />
          </Button>
        </div>
      </div>
    </div>
  );
}
