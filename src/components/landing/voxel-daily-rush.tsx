"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  RefreshCw,
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
    "What would you say in this situation?",
    "Prof moved the submission deadline to 11:59 PM...",
    "Best quiet corner in the library with charging sockets?",
    "Anyone building a team for the campus hackathon?",
  ];
  const [confessionIndex, setConfessionIndex] = useState(0);

  // Card 3 State: Academic tags
  const [selectedTag, setSelectedTag] = useState<string>("DSA");

  // Card 4 State: Verification builder
  const [selectedRole, setSelectedRole] = useState<string>("studying");

  return (
    <section id="features" className="relative py-16 sm:py-24 bg-background overflow-hidden">
      {/* Decorative background voxel blocks */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <span className="absolute top-12 right-[14%] size-3.5 rounded-xs bg-[#22c55e]/25 animate-bounce [animation-duration:4s]" />
        <span className="absolute bottom-20 left-[18%] size-3 rounded-xs bg-amber-400/25" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-[#16a34a] mb-2.5">
              <Zap className="size-3.5" />
              <span>CampusLoop Flow</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
              YOUR DAILY LOOP
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md">
              Jump into quick, bite-sized challenges and tools designed to strengthen every part of your campus life.
            </p>
          </div>

          <Link
            href="/feeds"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="inline-flex self-start sm:self-auto items-center gap-1.5 rounded-full bg-[#22c55e] hover:bg-[#16a34a] px-5 py-2 text-xs font-black text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <span>Explore All</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* 2x2 Interactive Cards Grid matching Image 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Card 1: QUICK PULSE */}
          <div className="group rounded-3xl border border-border/70 bg-card/80 p-5 sm:p-6 shadow-md transition-all hover:border-[#22c55e]/40 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setSelectedPulse("clubs");
                  }}
                  className={`flex w-full items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedPulse === "clubs"
                      ? "border-[#22c55e] bg-emerald-500/10 text-foreground font-bold shadow-xs"
                      : "border-border/50 bg-background/80 hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
                      <Users className="size-4" />
                    </div>
                    <span className="text-xs sm:text-sm">Campus Clubs &amp; Societies</span>
                  </div>
                  {selectedPulse === "clubs" && <CheckCircle2 className="size-4 text-[#22c55e]" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setSelectedPulse("career");
                  }}
                  className={`flex w-full items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedPulse === "career"
                      ? "border-[#22c55e] bg-emerald-500/10 text-foreground font-bold shadow-xs"
                      : "border-border/50 bg-background/80 hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                      <Briefcase className="size-4" />
                    </div>
                    <span className="text-xs sm:text-sm">Internships &amp; Gigs</span>
                  </div>
                  {selectedPulse === "career" && <CheckCircle2 className="size-4 text-[#22c55e]" />}
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/40">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                QUICK PULSE
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Discover trending student polls, opportunities, and college club announcements.
              </p>
            </div>
          </div>

          {/* Card 2: CAMPUS VOICE & CONFESSIONS */}
          <div className="group rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-rose-500/5 p-5 sm:p-6 shadow-md transition-all hover:border-rose-500/30 hover:shadow-lg flex flex-col justify-between">
            <div className="flex flex-col items-center justify-center py-4">
              {/* Green Speech Bubble matching Image 1 */}
              <div
                onClick={() => {
                  sounds.pop();
                  haptics.light();
                  setConfessionIndex((i) => (i + 1) % confessions.length);
                }}
                className="relative rounded-2xl bg-emerald-500/15 border border-emerald-500/30 px-5 py-4 text-center cursor-pointer hover:scale-102 transition-all shadow-xs"
                role="button"
                tabIndex={0}
                aria-label="Cycle confession topic"
              >
                <p className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300">
                  {confessions[confessionIndex]}
                </p>
                {/* Speech bubble tail pointer */}
                <div className="absolute -bottom-2 left-8 size-4 rotate-45 border-r border-b border-emerald-500/30 bg-emerald-500/15" />
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.pop();
                  haptics.light();
                  setConfessionIndex((i) => (i + 1) % confessions.length);
                }}
                className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <RefreshCw className="size-3" />
                <span>Tap to switch prompt</span>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-border/40">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                CAMPUS VOICE &amp; CONFESSIONS
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Build confidence with anonymous campus channels and real-time student sentiment.
              </p>
            </div>
          </div>

          {/* Card 3: ACADEMIC VAULT */}
          <div className="group rounded-3xl border border-border/70 bg-card/80 p-5 sm:p-6 shadow-md transition-all hover:border-blue-500/30 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-center gap-2.5 py-4">
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
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
                <span className="text-[11px] font-semibold text-[#16a34a]">
                  ✓ 140+ verified notes &amp; PYQs indexed for {selectedTag}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/40">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                ACADEMIC VAULT
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Curated peer-shared lecture notes, semester archives, and syllabus roadmaps.
              </p>
            </div>
          </div>

          {/* Card 4: STUDENT VERIFICATION */}
          <div className="group rounded-3xl border border-border/70 bg-card/80 p-5 sm:p-6 shadow-md transition-all hover:border-purple-500/30 hover:shadow-lg flex flex-col justify-between">
            <div>
              {/* Fill-in-the-blank puzzle UI matching Image 1 */}
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/90 p-3 shadow-inner">
                <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-black text-foreground">
                  The
                </span>
                <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-black text-foreground">
                  students
                </span>
                <span className="rounded-lg bg-[#22c55e]/20 border border-[#22c55e]/40 px-3 py-1 text-xs font-black text-[#16a34a] animate-pulse">
                  {selectedRole}
                </span>
              </div>

              {/* Selector Chips matching Image 1 */}
              <div className="mt-3 flex flex-wrap gap-2">
                {["studying", "collaborating", "verified", "graduating"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      sounds.pop();
                      haptics.light();
                      setSelectedRole(role);
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      selectedRole === role
                        ? "bg-[#22c55e] text-white shadow-xs"
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
                STUDENT VERIFICATION
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Real students with verified .ac.in credentials and college roll numbers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
