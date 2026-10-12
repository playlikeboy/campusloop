"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Users,
  Volume2,
  Zap,
} from "lucide-react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export function VoxelDailyRush() {
  // Card 1 State: Quick Pulse selection
  const [selectedPulse, setSelectedPulse] = useState<"clubs" | "career" | "pulse">("clubs");

  // Card 2 State: Voice prompts cycling
  const confessions = [
    "“The prof actually caught 4 people proxying in the back row today...”",
    "“Is it just me or does the hostel mess paneer feel like rubber on Tuesdays?”",
    "“4th floor library AC corner is ice cold — best spot for 2 AM prep.”",
    "“Building a team for the upcoming inter-college hackathon, need a frontend wizard.”",
  ];
  const [confessionIndex, setConfessionIndex] = useState(0);

  // Card 3 State: Academic tags
  const [selectedTag, setSelectedTag] = useState<string>("DSA");

  // Card 4 State: Verification builder
  const [selectedRole, setSelectedRole] = useState<string>("verified");

  return (
    <section id="daily-loop" className="relative py-10 sm:py-20 md:py-24 bg-background overflow-hidden select-none">
      {/* Decorative background voxel blocks */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <span className="absolute top-12 right-[14%] size-3.5 rounded-xs bg-[#22c55e]/25 animate-bounce [animation-duration:4s]" />
        <span className="absolute bottom-20 left-[18%] size-3 rounded-xs bg-amber-400/25" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 sm:pb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary mb-2.5 border border-primary/20">
              <Zap className="size-3.5 text-primary" />
              <span>Real-Time Campus Flow</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.08]">
              THE 24-HOUR CAMPUS
              <br />
              <span className="text-primary">DISCOVERY ENGINE.</span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md">
              Fresh confessions cycling live, instant exam survival cheat sheets, club recruitment blasts, and verified peer status.
            </p>
          </div>

          <Link
            href="/feeds"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="inline-flex self-start sm:self-auto items-center justify-center gap-1.5 rounded-full bg-primary hover:bg-primary/90 px-5 py-2.5 min-h-[44px] text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <span>Explore The Feed</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* 2x2 Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: QUICK PULSE */}
          <div className="group rounded-2xl sm:rounded-3xl border border-border/70 bg-card/80 p-4 sm:p-6 shadow-md transition-all hover:border-primary/40 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setSelectedPulse("clubs");
                  }}
                  className={`flex w-full items-center justify-between p-3 min-h-[48px] rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                    selectedPulse === "clubs"
                      ? "border-primary bg-primary/10 text-foreground font-bold shadow-xs"
                      : "border-border/50 bg-background/80 hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
                      <Users className="size-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold">Campus Clubs &amp; Societies</span>
                  </div>
                  {selectedPulse === "clubs" && <CheckCircle2 className="size-4 text-primary" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setSelectedPulse("career");
                  }}
                  className={`flex w-full items-center justify-between p-3 min-h-[48px] rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                    selectedPulse === "career"
                      ? "border-primary bg-primary/10 text-foreground font-bold shadow-xs"
                      : "border-border/50 bg-background/80 hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                      <Briefcase className="size-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold">Hackathons &amp; Verified Gigs</span>
                  </div>
                  {selectedPulse === "career" && <CheckCircle2 className="size-4 text-primary" />}
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/40">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                LIVE CAMPUS RADAR
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Discover trending student polls, fest recruitment calls, and verified society opportunities.
              </p>
            </div>
          </div>

          {/* Card 2: CAMPUS VOICE & CONFESSIONS */}
          <div className="group rounded-2xl sm:rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-rose-500/5 p-4 sm:p-6 shadow-md transition-all hover:border-rose-500/30 hover:shadow-lg flex flex-col justify-between">
            <div className="flex flex-col items-center justify-center py-4">
              {/* Green Speech Bubble with dynamic interactive prompt */}
              <div
                onClick={() => {
                  sounds.pop();
                  haptics.light();
                  setConfessionIndex((i) => (i + 1) % confessions.length);
                }}
                className="relative rounded-2xl bg-purple-500/10 border border-purple-500/25 px-5 py-4 text-center cursor-pointer hover:scale-102 transition-all shadow-xs"
                role="button"
                tabIndex={0}
                aria-label="Cycle confession topic"
              >
                <p className="text-xs sm:text-sm font-black text-purple-700 dark:text-purple-300">
                  {confessions[confessionIndex]}
                </p>
                {/* Speech bubble tail pointer */}
                <div className="absolute -bottom-2 left-8 size-4 rotate-45 border-r border-b border-purple-500/25 bg-purple-500/10" />
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.pop();
                  haptics.light();
                  setConfessionIndex((i) => (i + 1) % confessions.length);
                }}
                className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 min-h-[44px] text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <RefreshCw className="size-3" />
                <span>Tap to cycle live campus confessions</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                ZERO-KNOWLEDGE ANONYMITY
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Speak truth without fear. Your identity is stripped from database records before saving.
              </p>
            </div>
          </div>

          {/* Card 3: ACADEMIC VAULT */}
          <div className="group rounded-2xl sm:rounded-3xl border border-border/70 bg-card/80 p-4 sm:p-6 shadow-md transition-all hover:border-blue-500/30 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 py-3 sm:py-4">
                <button
                  type="button"
                  onClick={() => {
                    sounds.ting();
                    haptics.medium();
                  }}
                  className="flex size-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/25 active:scale-90 transition-all cursor-pointer"
                  aria-label="Sound alert for academic subject"
                >
                  <Volume2 className="size-5" />
                </button>

                {["DSA", "DBMS", "OS", "Maths"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      sounds.pop();
                      haptics.light();
                      setSelectedTag(tag);
                    }}
                    className={`px-3.5 py-2 min-h-[44px] flex items-center justify-center rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedTag === tag
                        ? "bg-foreground text-background shadow-xs scale-105"
                        : "bg-muted/70 text-foreground hover:bg-muted"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="mt-2 text-center">
                <span className="text-[11px] font-semibold text-primary">
                  ✓ 140+ verified notes &amp; PYQs indexed for {selectedTag}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/40">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                MIDNIGHT EXAM SURVIVAL
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Peer-rated handwritten notes, past 5-year question papers, and lab viva cheats.
              </p>
            </div>
          </div>

          {/* Card 4: STUDENT VERIFICATION */}
          <div className="group rounded-2xl sm:rounded-3xl border border-border/70 bg-card/80 p-4 sm:p-6 shadow-md transition-all hover:border-primary/30 hover:shadow-lg flex flex-col justify-between">
            <div>
              {/* Interactive badge preview */}
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/90 p-3 shadow-inner">
                <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-black text-foreground">
                  Status:
                </span>
                <span className="rounded-lg bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-bold text-primary flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  <span className="capitalize">{selectedRole} Student</span>
                </span>
              </div>

              {/* Selector Chips */}
              <div className="mt-3 flex flex-wrap gap-2">
                {["verified", "club lead", "topper", "contributor"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      sounds.pop();
                      haptics.light();
                      setSelectedRole(role);
                    }}
                    className={`rounded-xl px-3 py-2 min-h-[40px] flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                      selectedRole === role
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/40">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                100% INSTITUTIONAL GATING
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Gated exclusively by university .ac.in email or student ID. Zero bots, zero recruiters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
