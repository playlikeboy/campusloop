"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Heart,
  Radio,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export function VoxelFeaturesBento() {
  // Interactive radius toggle preview
  const [feedRadius, setFeedRadius] = useState<"local" | "all">("local");

  // Interactive Poll preview
  const [pollVoted, setPollVoted] = useState<number | null>(null);
  const [pollVotes, setPollVotes] = useState([68, 32]);

  // Interactive Notes subject preview
  const [activeSubject, setActiveSubject] = useState<"dsa" | "dbms" | "os" | "maths">("dsa");

  const handleVote = (idx: number) => {
    if (pollVoted !== null) return;
    sounds.ting();
    haptics.medium();
    setPollVoted(idx);
    setPollVotes((prev) => {
      const copy = [...prev];
      copy[idx] += 1;
      return copy;
    });
  };

  const subjectData = {
    dsa: { name: "Data Structures & Algorithms", notes: 142, pyqs: 38, icon: "🌲" },
    dbms: { name: "Database Systems (SQL & ACID)", notes: 98, pyqs: 24, icon: "💾" },
    os: { name: "Operating Systems & Concurrency", notes: 115, pyqs: 31, icon: "⚡" },
    maths: { name: "Discrete Mathematics & Linear Algebra", notes: 86, pyqs: 29, icon: "📐" },
  };

  return (
    <section id="features" className="relative py-20 sm:py-28 bg-background overflow-hidden select-none">
      {/* Decorative 3D Floating Voxel Blocks */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <motion.span
          animate={{ y: [0, -12, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 left-[10%] size-3.5 rounded-xs bg-[#22c55e]/25 shadow-xs"
        />
        <motion.span
          animate={{ y: [0, 15, 0], rotate: [0, -45, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-24 right-[12%] size-3 rounded-xs bg-amber-400/30"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-black text-[#16a34a] dark:text-emerald-400 mb-4 shadow-xs">
            <Sparkles className="size-3.5 text-[#22c55e]" />
            <span>Complete Campus Ecosystem</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.08]">
            EVERYTHING YOU NEED
            <br />
            <span className="text-[#16a34a] dark:text-emerald-400">FOR COLLEGE LIFE.</span>
          </h2>

          <p className="mt-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            From lecture notes and anonymous campus feeds to student clubs, dating decks, and hackathon teams — all verified, safe, and student-powered.
          </p>
        </div>

        {/* Voxel Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
          {/* Bento Item 1: Campus Feed & Radius Filter (7 cols) */}
          <div className="md:col-span-7 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-lg flex flex-col justify-between hover:border-emerald-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-emerald-500/15 text-[#16a34a]">
                    <Radio className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-foreground">Campus Pulse Feed</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Confessions, polls, and discussions</p>
                  </div>
                </div>

                {/* Interactive Radius Toggle */}
                <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/40 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                      setFeedRadius("local");
                    }}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      feedRadius === "local"
                        ? "bg-[#22c55e] text-white shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    My Campus
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                      setFeedRadius("all");
                    }}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      feedRadius === "all"
                        ? "bg-[#22c55e] text-white shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All India 🇮🇳
                  </button>
                </div>
              </div>

              {/* Feed Card Interactive Preview */}
              <div className="mt-5 space-y-3">
                {/* Confession item */}
                <div className="rounded-2xl border border-border/50 bg-background/80 p-3.5 text-left">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span className="font-bold text-rose-500">🎭 Anonymous Confession</span>
                    <span>10m ago • {feedRadius === "local" ? "BIT Mesra Hub" : "National Campus Feed"}</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-relaxed">
                    “Anyone else feel like the 3rd floor library corner is the only spot where Wi-Fi actually stays connected?”
                  </p>
                </div>

                {/* Interactive Poll item */}
                <div className="rounded-2xl border border-border/50 bg-background/80 p-3.5 text-left">
                  <span className="text-[10px] font-bold text-[#16a34a]">📊 Live Student Poll</span>
                  <p className="text-xs font-black text-foreground mt-0.5">Best midnight canteen snack?</p>

                  <div className="mt-2.5 space-y-1.5">
                    {["Egg Maggi & Chai", "Paneer Roll"].map((opt, idx) => {
                      const total = pollVotes[0] + pollVotes[1];
                      const pct = Math.round((pollVotes[idx] / total) * 100);
                      const isSelected = pollVoted === idx;

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleVote(idx)}
                          className={`relative flex w-full items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer overflow-hidden ${
                            isSelected
                              ? "border-[#22c55e] text-foreground"
                              : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          {/* Progress fill */}
                          <div
                            className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                              isSelected ? "bg-[#22c55e]/25" : "bg-muted/40"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                          <span className="relative z-10">{opt}</span>
                          <span className="relative z-10 text-[11px] font-black">{pct}%</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Zero spam • Real verified students</span>
              <Link
                href="/feeds"
                className="inline-flex items-center gap-1 text-xs font-black text-[#16a34a] hover:underline"
              >
                <span>Open Campus Feed</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Item 2: Academic Vault (5 cols) */}
          <div className="md:col-span-5 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-lg flex flex-col justify-between hover:border-blue-500/40 transition-all">
            <div>
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/40">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-600">
                  <BookOpen className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-foreground">Academic Notes Vault</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">15,000+ notes &amp; PYQs</p>
                </div>
              </div>

              {/* Subject Tabs */}
              <div className="mt-4 grid grid-cols-2 gap-1.5">
                {(["dsa", "dbms", "os", "maths"] as const).map((subKey) => (
                  <button
                    key={subKey}
                    type="button"
                    onClick={() => {
                      sounds.pop();
                      haptics.light();
                      setActiveSubject(subKey);
                    }}
                    className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                      activeSubject === subKey
                        ? "border-blue-500 bg-blue-500/10 text-foreground shadow-xs"
                        : "border-border/40 bg-background/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="text-sm mr-1">{subjectData[subKey].icon}</span>
                    <span className="uppercase text-[10px] font-black">{subKey}</span>
                  </button>
                ))}
              </div>

              {/* Active Subject Detail */}
              <div className="mt-4 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-background p-4 text-left">
                <p className="text-xs font-black text-foreground">{subjectData[activeSubject].name}</p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>📄 {subjectData[activeSubject].notes} Lecture Notes</span>
                  <span>📝 {subjectData[activeSubject].pyqs} Past Papers</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-lg">
                  <span>✓ Peer Verified &amp; Curated</span>
                  <span>Free Download</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Organized by semester</span>
              <Link
                href="/academics"
                className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:underline"
              >
                <span>Browse Vault</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Item 3: Campus Match & Dating Deck (5 cols) */}
          <div className="md:col-span-5 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-lg flex flex-col justify-between hover:border-pink-500/40 transition-all">
            <div>
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/40">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-pink-500/15 text-pink-600">
                  <Heart className="size-4.5 fill-pink-500/20 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-foreground">Campus Match &amp; Dating</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Verified student swipe deck</p>
                </div>
              </div>

              {/* Swipe Card Mockup */}
              <div className="mt-5 rounded-2xl border border-pink-500/30 bg-gradient-to-b from-pink-500/5 via-background to-background p-4 text-left relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-black">
                      A
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">Ananya, 21</p>
                      <p className="text-[10px] text-muted-foreground">Mechanical &apos;25 • BIT Mesra</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-pink-500/15 text-pink-600 text-[10px] font-black px-2 py-0.5">
                    Verified
                  </span>
                </div>

                <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed italic">
                  “Looking for someone to explain thermodynamics or go on late canteen walks.”
                </p>

                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold text-foreground">
                    ☕ Chai Enthusiast
                  </span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold text-foreground">
                    🎸 Indie Music
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.pop();
                      haptics.light();
                    }}
                    className="flex size-10 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer"
                    aria-label="Pass"
                  >
                    ✕
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.match();
                      haptics.medium();
                    }}
                    className="flex size-11 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    aria-label="Like"
                  >
                    <Heart className="size-5 fill-white" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Strict privacy &amp; verified IDs</span>
              <Link
                href="/dating"
                className="inline-flex items-center gap-1 text-xs font-black text-pink-600 hover:underline"
              >
                <span>Explore Dating</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Item 4: 1,350+ Colleges & Communities (7 cols) */}
          <div className="md:col-span-7 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-lg flex flex-col justify-between hover:border-amber-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
                    <GraduationCap className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-foreground">1,350+ College Hubs</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Every university in India indexed</p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-500/15 text-[#16a34a] text-[10px] font-black px-2.5 py-1">
                  Active Hubs
                </span>
              </div>

              {/* Sample Hub Chips */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { name: "BIT Mesra", count: "1,240 Students", tag: "Engineering" },
                  { name: "IIT Bombay", count: "3,890 Students", tag: "Tech & Science" },
                  { name: "BITS Pilani", count: "2,150 Students", tag: "Pilani / Goa" },
                  { name: "Delhi University", count: "5,420 Students", tag: "Central Univ" },
                  { name: "VIT Vellore", count: "4,180 Students", tag: "Vellore Hub" },
                  { name: "IIT Delhi", count: "3,110 Students", tag: "Hauz Khas" },
                ].map((college) => (
                  <div
                    key={college.name}
                    className="p-3 rounded-2xl border border-border/50 bg-background/80 text-left hover:border-amber-500/40 transition-all"
                  >
                    <p className="text-xs font-black text-foreground truncate">{college.name}</p>
                    <p className="text-[10px] font-semibold text-[#16a34a] mt-0.5">{college.count}</p>
                    <span className="text-[9px] text-muted-foreground">{college.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Join your official campus community</span>
              <Link
                href="/colleges"
                className="inline-flex items-center gap-1 text-xs font-black text-amber-600 hover:underline"
              >
                <span>Search All Colleges</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
