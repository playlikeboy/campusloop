"use client";

import { AlertTriangle, ArrowRight, Globe, Info, Megaphone, School, ShieldAlert, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { buttonVariants } from "@/components/ui/button";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface BroadcastData {
  id: string;
  rawTitle: string;
  title: string;
  body: string;
  priority: "INFO" | "ANNOUNCEMENT" | "WARNING" | "URGENT";
  scope: string;
  institutionName: string;
  bannerImageUrl?: string | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  createdAt?: string | null;
}

interface ActiveBroadcastResponse {
  broadcast: BroadcastData | null;
}

interface CampusBroadcastBannerProps {
  scope: "CAMPUS" | "GLOBAL";
  institutionId?: string | null;
  className?: string;
}

export function CampusBroadcastBanner({ scope, institutionId, className }: CampusBroadcastBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const { data } = useSWR<ActiveBroadcastResponse>(
    `/api/broadcasts/active?scope=${scope}${institutionId ? `&institutionId=${institutionId}` : ""}`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 15000,
    }
  );

  const broadcast = data?.broadcast;

  // Check if this specific broadcast was dismissed in this session
  useEffect(() => {
    if (!broadcast?.id) return;
    try {
      setIsDismissed(Boolean(sessionStorage.getItem(`campusloop_dismissed_broadcast_${broadcast.id}`)));
    } catch {
      // Storage blocked: the banner just shows again.
    }
  }, [broadcast?.id]);

  if (!broadcast || isDismissed) {
    return null;
  }

  // Colour follows meaning: warnings and urgent notices use the status colours, everything else stays neutral.
  const priorityStyles = {
    INFO: { border: "border-border", badgeBg: "bg-surface-muted text-fg-muted", icon: Info, label: "Info" },
    ANNOUNCEMENT: {
      border: "border-border",
      badgeBg: "bg-surface-muted text-fg-muted",
      icon: Megaphone,
      label: "Announcement",
    },
    WARNING: {
      border: "border-warning/40",
      badgeBg: "bg-warning-subtle text-warning",
      icon: AlertTriangle,
      label: "Heads up",
    },
    URGENT: {
      border: "border-danger/40",
      badgeBg: "bg-danger-subtle text-danger",
      icon: ShieldAlert,
      label: "Urgent",
    },
  };

  const style = priorityStyles[broadcast.priority] || priorityStyles.ANNOUNCEMENT;
  const PriorityIcon = style.icon;

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    sounds.tap();
    haptics.light();
    setIsDismissed(true);
    try {
      sessionStorage.setItem(`campusloop_dismissed_broadcast_${broadcast?.id}`, "true");
    } catch {
      // Storage blocked: dismissal lasts until the next page load.
    }
  }

  return (
    <div
      className={cn("relative mx-3 sm:mx-4 my-3 rounded-lg border bg-surface p-4", style.border, className)}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Pill */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
              style.badgeBg
            )}
          >
            <PriorityIcon className="size-3.5 shrink-0" aria-hidden />
            <span>{style.label}</span>
          </span>

          {/* Scope Indicator */}
          <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
            {broadcast.scope === "INDIA" ? (
              <>
                <Globe className="size-3.5" aria-hidden />
                <span>All colleges</span>
              </>
            ) : (
              <>
                <School className="size-3.5" aria-hidden />
                <span className="truncate max-w-[200px]">{broadcast.institutionName}</span>
              </>
            )}
          </span>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="-m-2 flex size-11 items-center justify-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-muted transition-ui cursor-pointer"
          aria-label="Hide this announcement"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {/* Banner Media Image if available */}
      {broadcast.bannerImageUrl && (
        <div className="w-full h-36 sm:h-44 rounded-md overflow-hidden my-2.5 bg-surface-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={broadcast.bannerImageUrl}
            alt={broadcast.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Headline */}
      <Link href={`/post/${broadcast.id}`} className="block group cursor-pointer space-y-1">
        <h3 className="text-base leading-snug group-hover:underline">{broadcast.title}</h3>

        {/* Body Text */}
        <p className="text-sm text-fg-muted line-clamp-3">{broadcast.body}</p>
      </Link>

      {/* Bottom Actions Bar */}
      <div className="mt-3 pt-2.5 border-t border-border flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {broadcast.actionLabel && broadcast.actionUrl && (
            <a
              href={broadcast.actionUrl}
              target={broadcast.actionUrl.startsWith("http") ? "_blank" : undefined}
              rel={broadcast.actionUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              className={buttonVariants({ size: "sm" })}
            >
              <span>{broadcast.actionLabel}</span>
              <ArrowRight className="size-4" aria-hidden />
            </a>
          )}

          <Link
            href={`/post/${broadcast.id}`}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-text hover:underline underline-offset-4 px-2"
          >
            <span>Open post</span>
          </Link>
        </div>

        {broadcast.createdAt && (
          <span className="text-xs text-fg-subtle tabular-nums">
            {new Date(broadcast.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
