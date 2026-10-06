"use client";

import * as React from "react";
import { Eye, Hourglass, KeyRound, Lock, Plus, Sparkles, Unlock } from "lucide-react";

export interface CapsuleEntry {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  title: string;
  content: string;
  timestamp: string;
}

export interface TimeCapsuleData {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImage?: string;
  targetUnlockDate: string | Date;
  isUnlocked: boolean;
  totalEntriesBuried: number;
  entries?: CapsuleEntry[];
}

export interface TimeCapsuleCardProps {
  capsule: TimeCapsuleData;
  onBuryMemory?: (capsuleId: string) => void;
  className?: string;
}

function LiveCountdown({ targetDate }: { targetDate: string | Date }) {
  const [timeLeft, setTimeLeft] = React.useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  React.useEffect(() => {
    function calculateTime() {
      const difference = new Date(targetDate).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.isPast) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-black text-xs text-emerald-400 uppercase tracking-wider">
        <Unlock className="size-3" />
        Vault Unlocked
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 font-bold font-mono text-foreground text-xs">
      <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card/80 px-2 py-1 shadow-2xs">
        <span className="font-black text-sm tabular-nums">{timeLeft.days}</span>
        <span className="font-sans text-[9px] text-muted-foreground uppercase">Days</span>
      </div>
      <span className="font-black text-muted-foreground">:</span>
      <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card/80 px-2 py-1 shadow-2xs">
        <span className="font-black text-sm tabular-nums">{String(timeLeft.hours).padStart(2, "0")}</span>
        <span className="font-sans text-[9px] text-muted-foreground uppercase">Hrs</span>
      </div>
      <span className="font-black text-muted-foreground">:</span>
      <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card/80 px-2 py-1 shadow-2xs">
        <span className="font-black text-sm tabular-nums">{String(timeLeft.minutes).padStart(2, "0")}</span>
        <span className="font-sans text-[9px] text-muted-foreground uppercase">Min</span>
      </div>
      <span className="font-black text-muted-foreground">:</span>
      <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card/80 px-2 py-1 shadow-2xs">
        <span className="font-black text-amber-500 text-sm tabular-nums">
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
        <span className="font-sans text-[9px] text-muted-foreground uppercase">Sec</span>
      </div>
    </div>
  );
}

export function TimeCapsuleCard({
  capsule,
  onBuryMemory,
  className = "",
}: TimeCapsuleCardProps) {
  const [showEntries, setShowEntries] = React.useState(capsule.isUnlocked);
  const [buriedCount, setBuriedCount] = React.useState(capsule.totalEntriesBuried);
  const [justBuried, setJustBuried] = React.useState(false);
  const isUnlocked = capsule.isUnlocked;

  const handleBury = () => {
    setBuriedCount((c) => c + 1);
    setJustBuried(true);
    onBuryMemory?.(capsule.id);
    setTimeout(() => setJustBuried(false), 2400);
  };

  return (
    <div
      className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-border/50 bg-card text-card-foreground shadow-xl transition-all duration-300 hover:border-border hover:shadow-2xl select-none ${className}`}
    >
      {/* Cover Image Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-52">
        {capsule.coverImage && (
          <img
            src={capsule.coverImage}
            alt={capsule.title}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Status Pill Badge */}
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5">
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-black text-xs uppercase tracking-wider shadow-sm backdrop-blur-md ${
              isUnlocked
                ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                : "border-amber-500/40 bg-amber-500/20 text-amber-400"
            }`}
          >
            {isUnlocked ? (
              <>
                <Unlock className="size-3" />
                <span>Vault Unlocked</span>
              </>
            ) : (
              <>
                <Lock className="size-3" />
                <span>Sealed Vault</span>
              </>
            )}
          </span>
        </div>

        {/* Category Tag */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className="rounded-full border border-border/40 bg-background/80 px-2.5 py-0.5 font-black text-[10px] text-foreground uppercase tracking-wider backdrop-blur-md">
            {capsule.category}
          </span>
        </div>

        {/* Title & Description Overlay */}
        <div className="absolute inset-x-4 bottom-3.5 z-10 space-y-1">
          <h3 className="font-black text-foreground text-lg leading-snug drop-shadow-xs">
            {capsule.title}
          </h3>
          {capsule.description && (
            <p className="line-clamp-1 font-medium text-muted-foreground text-xs">
              {capsule.description}
            </p>
          )}
        </div>
      </div>

      {/* Card Info Body */}
      <div className="space-y-4 p-5">
        {/* Countdown Header */}
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-border/40 bg-muted/30 p-3.5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <Hourglass className="size-4 shrink-0" />
            </div>
            <div className="text-xs">
              <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                {isUnlocked ? "Unlocked Date" : "Unlocks Automatically On"}
              </span>
              <span className="font-black text-foreground">
                {new Date(capsule.targetUnlockDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <LiveCountdown targetDate={capsule.targetUnlockDate} />
        </div>

        {/* Buried Count & Action Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 font-bold text-muted-foreground text-xs">
            <KeyRound className="size-3.5 text-primary" />
            <span>
              <strong className="font-black text-foreground">{buriedCount}</strong> Sealed Memories
            </span>
          </div>

          {!isUnlocked ? (
            <button
              type="button"
              onClick={handleBury}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 font-black text-white text-xs shadow-md transition-all hover:bg-amber-600 active:scale-95"
            >
              <Plus className="size-3.5" />
              <span>{justBuried ? "Memory Sealed" : "Bury Memory"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowEntries(!showEntries)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-muted px-4 py-2 font-bold text-foreground text-xs transition-all hover:bg-muted/80"
            >
              <Eye className="size-3.5 text-emerald-500" />
              <span>{showEntries ? "Hide Memories" : "View Museum Wall"}</span>
            </button>
          )}
        </div>

        {/* Success toast micro-interaction */}
        {justBuried && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-400 text-xs">
            <Sparkles className="size-4 shrink-0" />
            <span>Your memory has been cryptographically sealed until graduation day!</span>
          </div>
        )}

        {/* Revealed Museum Wall Entries */}
        {isUnlocked && showEntries && capsule.entries && capsule.entries.length > 0 && (
          <div className="space-y-3 border-border/30 border-t pt-3">
            <h4 className="font-black text-[11px] text-muted-foreground uppercase tracking-wider">
              Buried Memories & Predictions
            </h4>
            <div className="space-y-2">
              {capsule.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="space-y-1.5 rounded-2xl border border-border/40 bg-muted/20 p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-foreground">{entry.authorName}</span>
                    <span className="text-[10px] text-muted-foreground">{entry.timestamp}</span>
                  </div>
                  <p className="font-bold text-foreground">"{entry.title}"</p>
                  <p className="font-medium text-muted-foreground">{entry.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
