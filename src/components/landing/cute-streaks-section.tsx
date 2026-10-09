"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  Crown,
  Flame,
  Lock,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CuteCatSuccess, CuteSparkle } from "@/components/ui/cute-illustrations";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export function CuteStreaksSection() {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(6);
  const [currentPoints, setCurrentPoints] = useState(480);

  const handleSimulateCheckIn = () => {
    if (hasCheckedIn) return;
    sounds.ting();
    haptics.medium();
    setHasCheckedIn(true);
    setCurrentStreak((s) => s + 1);
    setCurrentPoints((p) => p + 25);
  };

  const milestones = [
    {
      days: "3 Days",
      title: "Campus Spark",
      reward: "+50 LP",
      desc: "Unlocks animated reaction effects in discussions",
      isReached: true,
    },
    {
      days: "7 Days",
      title: "Hostel Legend",
      reward: "+150 LP",
      desc: "Unlocks +2 extra Secret Crush Vault slots",
      isReached: currentStreak >= 7,
    },
    {
      days: "14 Days",
      title: "Campus Insider",
      reward: "+300 LP",
      desc: "Priority note indexing in the Academic Vault",
      isReached: false,
    },
    {
      days: "30 Days",
      title: "Campus Legend",
      reward: "+1,000 LP",
      desc: "Permanent golden verified halo badge",
      isReached: false,
    },
  ];

  return (
    <section className="relative py-12 sm:py-20 bg-background select-none">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 7 cols: Content & Streak Cards */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                <Flame className="size-3.5 fill-primary text-primary" />
                <span>Daily Streaks &amp; Loop Points</span>
              </div>

              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.15]">
                Clout that actually helps your college life.
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                Earn Loop Points (LP) by sharing solved PYQs, answering junior questions, and keeping up daily streaks. No fake likes — just authentic campus appreciation.
              </p>

              {/* Interactive Check-In Card */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="size-4 text-primary fill-primary" />
                      <span className="font-heading font-bold text-sm sm:text-base text-foreground">
                        {currentStreak}-Day Active Streak
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Current Balance: {currentPoints} LP
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSimulateCheckIn}
                    disabled={hasCheckedIn}
                    className="h-9 px-4 text-xs font-bold gap-1.5"
                  >
                    <Sparkles className="size-3.5" />
                    <span>{hasCheckedIn ? "Checked In Today!" : "Check In (+25 LP)"}</span>
                  </Button>
                </div>

                {/* Progress bar towards 7-Day unlock */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                    <span>Progress to 7-Day Hostel Legend</span>
                    <span className="text-primary font-mono">{currentStreak} / 7 Days</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((currentStreak / 7) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Milestone Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {milestones.map((m) => (
                  <div
                    key={m.days}
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                      m.isReached
                        ? "border-primary/40 bg-primary/5 shadow-2xs"
                        : "border-border/60 bg-muted/10 opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono text-primary">{m.days}</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {m.reward}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-foreground truncate">{m.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 cols: Cute Mascot Graphic */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-canvas/30 border border-border/60">
              <CuteCatSuccess size={120} className="mb-3" />
              <h3 className="font-heading font-bold text-base text-foreground">
                Celebrate Every Milestone
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                Rank on your college leaderboard and unlock exclusive secret crush vault capacity as you engage.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="catYellow" className="text-[11px]">
                  Daily Streaks
                </Badge>
                <Badge variant="catBlue" className="text-[11px]">
                  Helpful Answers
                </Badge>
                <Badge variant="catPink" className="text-[11px]">
                  Verified Clout
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
