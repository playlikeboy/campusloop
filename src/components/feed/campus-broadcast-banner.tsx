"use client";

import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Globe,
  Info,
  Megaphone,
  Radio,
  School,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
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
  institutionId?: string;
  className?: string;
}

export function CampusBroadcastBanner({
  scope,
  institutionId,
  className,
}: CampusBroadcastBannerProps) {
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
    if (broadcast?.id && typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem(`campusloop_dismissed_broadcast_${broadcast.id}`);
      setIsDismissed(Boolean(dismissed));
    }
  }, [broadcast?.id]);

  if (!broadcast || isDismissed) {
    return null;
  }

  const priorityStyles = {
    INFO: {
      border: "border-blue-500/40",
      bg: "bg-gradient-to-r from-blue-500/10 via-card to-card",
      badgeBg: "bg-blue-500/20 border-blue-500/30 text-blue-500",
      icon: Info,
      label: "CAMPUS INFO",
      glow: "shadow-[0_0_24px_rgba(59,130,246,0.12)]",
    },
    ANNOUNCEMENT: {
      border: "border-primary/40",
      bg: "bg-gradient-to-r from-primary/10 via-card to-card",
      badgeBg: "bg-primary/20 border-primary/30 text-primary",
      icon: Megaphone,
      label: "OFFICIAL ANNOUNCEMENT",
      glow: "shadow-[0_0_24px_rgba(147,51,234,0.12)]",
    },
    WARNING: {
      border: "border-amber-500/40",
      bg: "bg-gradient-to-r from-amber-500/10 via-card to-card",
      badgeBg: "bg-amber-500/20 border-amber-500/30 text-amber-500",
      icon: AlertTriangle,
      label: "CAMPUS ADVISORY",
      glow: "shadow-[0_0_24px_rgba(245,158,11,0.12)]",
    },
    URGENT: {
      border: "border-rose-500/50",
      bg: "bg-gradient-to-r from-rose-500/15 via-card to-card",
      badgeBg: "bg-rose-500/20 border-rose-500/30 text-rose-500",
      icon: ShieldAlert,
      label: "URGENT NOTICE",
      glow: "shadow-[0_0_28px_rgba(244,63,94,0.18)]",
    },
  };

  const style = priorityStyles[broadcast.priority] || priorityStyles.ANNOUNCEMENT;
  const PriorityIcon = style.icon;

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    sounds.tap();
    haptics.light();
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`campusloop_dismissed_broadcast_${broadcast?.id}`, "true");
    }
  }

  return (
    <div
      className={cn(
        "relative mx-3 sm:mx-4 my-2.5 rounded-2xl border p-4 transition-all duration-300 backdrop-blur-md",
        style.border,
        style.bg,
        style.glow,
        className
      )}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Pill */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
              style.badgeBg
            )}
          >
            <PriorityIcon className="size-3 shrink-0 animate-pulse" />
            <span>{style.label}</span>
          </span>

          {/* Scope Indicator */}
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-border/30">
            {broadcast.scope === "INDIA" ? (
              <>
                <Globe className="size-3 text-primary" />
                <span>Pan-India Broadcast</span>
              </>
            ) : (
              <>
                <School className="size-3 text-primary" />
                <span className="truncate max-w-[200px]">{broadcast.institutionName}</span>
              </>
            )}
          </span>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
          title="Dismiss announcement"
          aria-label="Dismiss announcement"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Banner Media Image if available */}
      {broadcast.bannerImageUrl && (
        <div className="w-full h-36 sm:h-44 rounded-xl overflow-hidden my-2.5 bg-muted/30 border border-border/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={broadcast.bannerImageUrl}
            alt={broadcast.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Headline */}
      <Link href={`/post/${broadcast.id}`} className="block group cursor-pointer space-y-1">
        <h3 className="text-sm sm:text-base font-black text-foreground leading-snug group-hover:underline">
          {broadcast.title}
        </h3>

        {/* Body Text */}
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed line-clamp-3">
          {broadcast.body}
        </p>
      </Link>

      {/* Bottom Actions Bar */}
      <div className="mt-3 pt-2.5 border-t border-border/30 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {broadcast.actionLabel && broadcast.actionUrl && (
            <a
              href={broadcast.actionUrl}
              target={broadcast.actionUrl.startsWith("http") ? "_blank" : undefined}
              rel={broadcast.actionUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer"
            >
              <span>{broadcast.actionLabel}</span>
              <ArrowRight className="size-3" />
            </a>
          )}

          <Link
            href={`/post/${broadcast.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline transition-colors px-2 py-1"
          >
            <span>Campus Discussion</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>

        {broadcast.createdAt && (
          <span className="text-[10px] text-muted-foreground font-semibold">
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
