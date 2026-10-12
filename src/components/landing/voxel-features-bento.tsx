"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Code2,
  Cpu,
  Database,
  FileText,
  Flame,
  Globe2,
  GraduationCap,
  Heart,
  Layers,
  MapPin,
  MessageSquare,
  Music2,
  Radio,
  ShieldCheck,
  Sparkles,
  Vote,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export function VoxelFeaturesBento() {
  // Interactive radius toggle preview
  const [feedRadius, setFeedRadius] = useState<"local" | "all">("local");

  // Interactive Poll preview
  const [pollVoted, setPollVoted] = useState<number | null>(null);
  const [pollVotes, setPollVotes] = useState([76, 24]);

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
    dsa: { name: "Data Structures & Algorithms", notes: 142, pyqs: 38, icon: Code2 },
    dbms: { name: "Database Systems (SQL & ACID)", notes: 98, pyqs: 24, icon: Database },
    os: { name: "Operating Systems & Concurrency", notes: 115, pyqs: 31, icon: Cpu },
    maths: { name: "Discrete Math & Linear Algebra", notes: 86, pyqs: 29, icon: Layers },
  };

  return (
    <section id="features" className="relative py-10 sm:py-20 md:py-24 bg-background overflow-hidden select-none">
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
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary mb-2.5 sm:mb-3.5 border border-primary/20 shadow-xs">
            <Zap className="size-3.5 text-primary" />
            <span>Built For University Life</span>
          </div>

          <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.12]">
            EVERY UNWRITTEN RULE OF CAMPUS.{" "}
            <br className="hidden sm:inline" />
            <span className="text-primary">CODED INTO ONE SYSTEM.</span>
          </h2>

          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Your campus has a digital layer. Anonymous conversations, topper-curated notes, solved PYQs, student clubs, and campus crush radar.
          </p>
        </div>

        {/* Voxel Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          {/* Bento Item 1: Campus Radius Radar (7 cols) */}
          <div className="md:col-span-7 rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all">
            <div>
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Radio className="size-4 sm:size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-base font-black text-foreground">The Campus Radius Radar</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Switch between local hostel banter &amp; national trends</p>
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
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
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
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                      feedRadius === "all"
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Globe2 className="size-3" />
                    <span>All India</span>
                  </button>
                </div>
              </div>

              {/* Feed Card Interactive Preview */}
              <div className="mt-5 space-y-3">
                {/* Confession item */}
                <div className="rounded-2xl border border-border/50 bg-background/80 p-3.5 text-left">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span className="font-black text-rose-500 flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      <span>Anonymous Confession</span>
                    </span>
                    <span>10m ago • {feedRadius === "local" ? "BIT Mesra Hub" : "National Campus Timeline"}</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-relaxed">
                    &ldquo;Anyone else feel like the 3rd floor library corner is the only spot where the campus Wi-Fi doesn&apos;t drop during assignments?&rdquo;
                  </p>
                </div>

                {/* Interactive Poll item */}
                <div className="rounded-2xl border border-border/50 bg-background/80 p-3.5 text-left">
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                    <Vote className="size-3" />
                    <span>Live Student Poll</span>
                  </span>
                  <p className="text-xs font-black text-foreground mt-0.5">Best 2 AM canteen survival food?</p>

                  <div className="mt-2.5 space-y-1.5">
                    {["Egg Maggi & Cutting Chai", "Paneer Roll & Cold Coffee"].map((opt, idx) => {
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
                              ? "border-primary text-foreground"
                              : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          {/* Progress fill */}
                          <div
                            className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                              isSelected ? "bg-primary/20" : "bg-muted/40"
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
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Encrypted anonymity • Zero doxxing</span>
              </span>
              <Link
                href="/feeds"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <span>Open Campus Feed</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Item 2: Academic Vault (5 cols) */}
          <div className="md:col-span-5 rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col justify-between hover:border-blue-500/40 transition-all">
            <div>
              <div className="flex items-center gap-2.5 pb-3 sm:pb-4 border-b border-border/40">
                <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 shrink-0">
                  <BookOpen className="size-4 sm:size-4.5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-base font-black text-foreground">The Midnight Academic Vault</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">45,000+ verified notes &amp; solved PYQs</p>
                </div>
              </div>

              {/* Subject Tabs */}
              <div className="mt-4 grid grid-cols-2 gap-1.5">
                {(["dsa", "dbms", "os", "maths"] as const).map((subKey) => {
                  const Icon = subjectData[subKey].icon;
                  return (
                    <button
                      key={subKey}
                      type="button"
                      onClick={() => {
                        sounds.pop();
                        haptics.light();
                        setActiveSubject(subKey);
                      }}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeSubject === subKey
                          ? "border-blue-500 bg-blue-500/10 text-foreground shadow-xs"
                          : "border-border/40 bg-background/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="size-3.5 text-blue-500 shrink-0" />
                      <span className="uppercase text-[10px] font-black">{subKey}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Subject Detail */}
              <div className="mt-4 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-background p-3.5 sm:p-4 text-left">
                <p className="text-xs font-black text-foreground">{subjectData[activeSubject].name}</p>
                <div className="mt-2.5 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="size-3 text-blue-500" />
                    <span>{subjectData[activeSubject].notes} Lecture Notes</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="size-3 text-amber-500" />
                    <span>{subjectData[activeSubject].pyqs} Solved PYQs</span>
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-lg">
                  <span>Peer Verified • Prof Rated</span>
                  <span>100% Free Download</span>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 pt-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Organized by semester &amp; branch</span>
              <Link
                href="/academics"
                className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:underline cursor-pointer"
              >
                <span>Browse Vault</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Item 3: Campus Match & Secret Crush (5 cols) */}
          <div className="md:col-span-5 rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col justify-between hover:border-pink-500/40 transition-all">
            <div>
              <div className="flex items-center gap-2.5 pb-3 sm:pb-4 border-b border-border/40">
                <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-pink-500/15 text-pink-600 shrink-0">
                  <Heart className="size-4 sm:size-4.5 fill-pink-500/20 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-base font-black text-foreground">Campus Match &amp; Crush Deck</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Verified student swipe deck • Zero creeps</p>
                </div>
              </div>

              {/* Swipe Card Mockup */}
              <div className="mt-4 sm:mt-5 rounded-2xl border border-pink-500/30 bg-gradient-to-b from-pink-500/5 via-background to-background p-3.5 sm:p-4 text-left relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-black">
                      AN
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">Ananya, 21</p>
                      <p className="text-[10px] text-muted-foreground">Mechanical &apos;25 • BIT Mesra</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-pink-500/15 text-pink-600 text-[10px] font-black px-2 py-0.5 flex items-center gap-1">
                    <ShieldCheck className="size-3" />
                    <span>Verified</span>
                  </span>
                </div>

                <p className="mt-2.5 sm:mt-3 text-[11px] text-muted-foreground leading-relaxed italic">
                  &ldquo;Looking for someone to survive thermodynamics with or go on late canteen walks.&rdquo;
                </p>

                <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[9px] font-bold text-foreground flex items-center gap-1">
                    <Sparkles className="size-2.5 text-amber-500" />
                    <span>Chai Connoisseur</span>
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[9px] font-bold text-foreground flex items-center gap-1">
                    <Music2 className="size-2.5 text-rose-500" />
                    <span>Indie Rock</span>
                  </span>
                </div>

                <div className="mt-3.5 sm:mt-4 flex items-center justify-center gap-4 pt-1 sm:pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.pop();
                      haptics.light();
                    }}
                    className="flex size-10 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer touch-manipulation"
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
                    className="flex size-11 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer touch-manipulation"
                    aria-label="Like"
                  >
                    <Heart className="size-5 fill-white" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 pt-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Strict university email gating</span>
              <Link
                href="/dating"
                className="inline-flex items-center gap-1 text-xs font-black text-pink-600 hover:underline cursor-pointer"
              >
                <span>Explore Campus Match</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Item 4: 1,350+ Colleges & Communities (7 cols) */}
          <div className="md:col-span-7 rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col justify-between hover:border-amber-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 shrink-0">
                    <GraduationCap className="size-4 sm:size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-base font-black text-foreground">1,350+ Live College Hubs</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Every tier-1 institute, NIT, and university indexed</p>
                  </div>
                </div>

                <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1">
                  Active Directory
                </span>
              </div>

              {/* Sample Hub Chips */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { name: "BIT Mesra", count: "1,240 Students", tag: "Ranchi Hub" },
                  { name: "IIT Bombay", count: "3,890 Students", tag: "Powai Hub" },
                  { name: "BITS Pilani", count: "Pilani & Goa", tag: "Pilani Hub" },
                  { name: "Delhi University", count: "5,420 Students", tag: "North & South" },
                  { name: "VIT Vellore", count: "4,180 Students", tag: "Vellore Hub" },
                  { name: "IIT Delhi", count: "3,110 Students", tag: "Hauz Khas" },
                ].map((college) => (
                  <div
                    key={college.name}
                    className="p-3 rounded-2xl border border-border/50 bg-background/80 text-left hover:border-primary/40 transition-all cursor-pointer"
                  >
                    <p className="text-xs font-black text-foreground truncate">{college.name}</p>
                    <p className="text-[10px] font-semibold text-primary mt-0.5">{college.count}</p>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="size-2.5" />
                      <span>{college.tag}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Join your verified college community</span>
              <Link
                href="/colleges"
                className="inline-flex items-center gap-1 text-xs font-black text-amber-600 hover:underline cursor-pointer"
              >
                <span>Search All 1,350+ Colleges</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
