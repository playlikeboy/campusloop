"use client";

import {
  Globe,
  Info,
  Lock,
  School,
  ShieldCheck,
  Sparkles,
  VenetianMask,
} from "lucide-react";
import { useState } from "react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface ConfessionSidebarProps {
  scope: "CAMPUS" | "GLOBAL";
  onScopeChange: (scope: "CAMPUS" | "GLOBAL") => void;
  campusName: string;
  activeTag?: string | null;
  onTagSelect?: (tag: string) => void;
  className?: string;
}

const TOPIC_TAGS = [
  { tag: "#HostelLore", count: "1.4k" },
  { tag: "#PlacementTea", count: "980" },
  { tag: "#CampusCrush", count: "2.1k" },
  { tag: "#ExamVent", count: "860" },
  { tag: "#ProfTales", count: "540" },
  { tag: "#Unfiltered", count: "1.8k" },
  { tag: "#LateNightThoughts", count: "720" },
  { tag: "#MessFoodHorrors", count: "610" },
];

export function ConfessionSidebar({
  scope,
  onScopeChange,
  campusName,
  activeTag,
  onTagSelect,
  className,
}: ConfessionSidebarProps) {
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);

  return (
    <aside className={cn("flex flex-col gap-4 select-none", className)}>
      {/* ─── 1. Architectural Anonymity Vault Card ─── */}
      <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-950/25 via-card/70 to-card/40 p-4.5 space-y-3.5 shadow-2xs backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-400">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/35">
              <VenetianMask className="size-4" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Cryptographic Anonymity</h2>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Lock className="size-2.5" /> Sealed
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Confessions are isolated from your student account. Your verified identity, roll number, and personal profile are never linked or revealed to other students.
        </p>

        <button
          type="button"
          onClick={() => {
            sounds.tap();
            haptics.light();
            setShowPrivacyDetails((prev) => !prev);
          }}
          className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 text-[11px] font-bold text-purple-300 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-purple-400" />
            How Accountable Privacy Works
          </span>
          <span className="text-[10px] text-purple-400/80 font-mono">
            {showPrivacyDetails ? "Hide" : "Details"}
          </span>
        </button>

        {showPrivacyDetails && (
          <div className="space-y-2 pt-1 border-t border-purple-500/20 text-[11px] text-muted-foreground leading-relaxed animate-in fade-in duration-150">
            <div className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">1.</span>
              <span><strong>Zero FK Linkage:</strong> The database row stores only a thread pseudonym. Real author ID is null.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">2.</span>
              <span><strong>Client-Side PII Filter:</strong> Phone numbers, room numbers, and personal handles are auto-quarantined.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">3.</span>
              <span><strong>Verified Gate:</strong> Only verified college students can post, eliminating external trolls.</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── 2. Scope Quick Switcher ─── */}
      <div className="rounded-2xl border border-border/30 bg-card/60 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Feed Scope
          </span>
          <span className="text-[10px] text-muted-foreground">1,350+ Hubs</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onScopeChange("GLOBAL")}
            className={cn(
              "flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer relative before:absolute before:-inset-1 before:content-['']",
              scope === "GLOBAL"
                ? "border-primary/50 bg-primary/10 text-primary shadow-2xs font-semibold"
                : "border-border/40 hover:bg-muted/40 text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Globe className="size-3.5" />
              <span>All India</span>
            </div>
            <span className="text-[10px] text-muted-foreground">National pulse</span>
          </button>

          <button
            type="button"
            onClick={() => onScopeChange("CAMPUS")}
            className={cn(
              "flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer relative before:absolute before:-inset-1 before:content-['']",
              scope === "CAMPUS"
                ? "border-primary/50 bg-primary/10 text-primary shadow-2xs font-semibold"
                : "border-border/40 hover:bg-muted/40 text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs truncate w-full">
              <School className="size-3.5 shrink-0" />
              <span className="truncate">{campusName}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Your college hub</span>
          </button>
        </div>
      </div>

      {/* ─── 3. Trending Topics Tag Cloud ─── */}
      <div className="rounded-2xl border border-border/30 bg-card/60 p-4 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3 text-purple-400" />
            <span>Popular Whisper Tags</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {TOPIC_TAGS.map((item) => {
            const isSelected = activeTag === item.tag;
            return (
              <button
                key={item.tag}
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  onTagSelect?.(isSelected ? "" : item.tag);
                }}
                className={cn(
                  "h-7 px-2.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border flex items-center gap-1",
                  isSelected
                    ? "bg-purple-500 text-white border-purple-400 shadow-xs ring-1 ring-purple-400/40"
                    : "bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border-border/40"
                )}
              >
                <span>{item.tag}</span>
                <span className={cn("text-[9px] font-mono", isSelected ? "text-white/80" : "text-muted-foreground/60")}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 4. Community Safe-Harbor Pledge ─── */}
      <div className="rounded-2xl border border-border/30 bg-card/60 p-4 space-y-2.5 shadow-2xs text-xs text-muted-foreground">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <Info className="size-3 text-primary" />
          <span>Community Pledge</span>
        </h3>
        <ul className="space-y-1.5 text-[11px] leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="text-purple-400 font-bold">•</span>
            <span>No targeted harassment, doxxing, or naming individual peers.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-purple-400 font-bold">•</span>
            <span>Wholesome secrets, funny hostel sagas, and exam vents welcomed.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-purple-400 font-bold">•</span>
            <span>Flag toxic content instantly via the card report button.</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
