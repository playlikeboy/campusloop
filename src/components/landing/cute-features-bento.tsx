"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Code2,
  Cpu,
  Database,
  Globe2,
  GraduationCap,
  Heart,
  Layers,
  Lock,
  VenetianMask,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CuteCatStudy,
  CuteHeart,
  CuteSparkle,
} from "@/components/ui/cute-illustrations";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export function CuteFeaturesBento() {
  const [activeSubject, setActiveSubject] = useState<"dsa" | "dbms" | "os" | "maths">("dsa");
  const [activeRadius, setActiveRadius] = useState<"campus" | "global">("campus");

  const subjects = {
    dsa: {
      name: "Data Structures & Algorithms",
      code: "CS301",
      notes: "142 notes",
      pyqs: "38 solved PYQs",
      icon: Code2,
    },
    dbms: {
      name: "Database Management Systems",
      code: "CS402",
      notes: "98 notes",
      pyqs: "24 solved PYQs",
      icon: Database,
    },
    os: {
      name: "Operating Systems & Concurrency",
      code: "CS405",
      notes: "115 notes",
      pyqs: "31 solved PYQs",
      icon: Cpu,
    },
    maths: {
      name: "Discrete Mathematics & Graph Theory",
      code: "MA201",
      notes: "86 notes",
      pyqs: "29 solved PYQs",
      icon: Layers,
    },
  };

  return (
    <section id="features" className="relative py-12 sm:py-20 md:py-24 bg-background select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-3">
            <CuteSparkle size={14} className="text-primary" />
            <span>Built Exclusively for Students</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.12]">
            Everything that actually matters in college.
          </h2>

          <p className="mt-3 text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
            Four core student spaces crafted with extreme privacy, warm aesthetics, and zero faculty surveillance.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
          {/* Card 1: Academic Vault (Large 7 Cols) */}
          <div className="md:col-span-7 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <Badge variant="catBlue" className="gap-1.5 text-xs py-1 px-3">
                  <BookOpen className="size-3.5" />
                  <span>The Academic Vault</span>
                </Badge>
                <span className="text-xs font-bold text-muted-foreground">100% Free · Zero Paywalls</span>
              </div>

              <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                45,000+ Verified Lecture Notes &amp; Solved PYQs
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Exam tomorrow? Access handwritten notes by top students, step-by-step previous year question solutions, and syllabus roadmaps.
              </p>

              {/* Interactive Subject Switcher */}
              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {(["dsa", "dbms", "os", "maths"] as const).map((key) => {
                    const isSelected = activeSubject === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          sounds.tap();
                          haptics.light();
                          setActiveSubject(key);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-2xs"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                        }`}
                      >
                        {subjects[key].code}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Subject Preview Card */}
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {subjects[activeSubject].name}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                      {subjects[activeSubject].notes} · {subjects[activeSubject].pyqs}
                    </p>
                  </div>
                  <Link href="/academics" onClick={() => sounds.tap()}>
                    <Button size="sm" variant="secondary" className="shrink-0 text-xs font-bold gap-1">
                      <span>Browse</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Cute Cat Study Mascot Footer */}
            <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Crowdsourced by students across IITs, NITs, BITS, and DU
              </span>
              <CuteCatStudy size={64} className="shrink-0" />
            </div>
          </div>

          {/* Card 2: Anonymous Confessions (5 Cols) */}
          <div className="md:col-span-5 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <Badge variant="catPink" className="gap-1.5 text-xs py-1 px-3">
                  <VenetianMask className="size-3.5" />
                  <span>Confessions &amp; Tea</span>
                </Badge>
                <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                  <Lock className="size-3" />
                  <span>Decoupled</span>
                </div>
              </div>

              <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                Inside Hostel Tea. Zero Leaks.
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                When you post anonymously, your identity is cryptographically decoupled before the database write. Say what needs to be said.
              </p>

              {/* Sample Whisper Quote */}
              <div className="mt-5 p-4 rounded-2xl border border-border/70 bg-canvas/30 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                  Trending in Hostel 4
                </span>
                <p className="text-xs sm:text-sm text-foreground font-medium italic">
                  &ldquo;Whoever plays acoustic guitar on the 3rd floor terrace after 2 AM, please never stop. It&apos;s getting us through mid-terms.&rdquo;
                </p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary pt-1">
                  <CuteHeart size={14} />
                  <span>289 fellow students agreed</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/50">
              <Link href="/confessions" className="w-full">
                <Button variant="secondary" className="w-full text-xs font-bold gap-1.5">
                  <VenetianMask className="size-3.5" />
                  <span>Explore Campus Whispers</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 3: Campus Match & Secret Crush (5 Cols) */}
          <div className="md:col-span-5 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <Badge variant="coral" className="gap-1.5 text-xs py-1 px-3">
                  <Heart className="size-3.5" />
                  <span>Campus Match</span>
                </Badge>
                <span className="text-[11px] font-bold text-muted-foreground">Verified Students</span>
              </div>

              <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                Mutual Crushes. Zero Awkwardness.
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Add classmates to your private Zero Knowledge Vault. Neither person is ever notified unless they also add you back.
              </p>

              {/* Feature Highlights */}
              <div className="mt-5 space-y-2.5">
                {[
                  "No random strangers — verified university peers only",
                  "Filter by campus radius, batch, and interests",
                  "Instant chat unlocks only on mutual match",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <CuteSparkle size={14} className="text-primary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/50">
              <Link href="/dating" className="w-full">
                <Button variant="secondary" className="w-full text-xs font-bold gap-1.5">
                  <Heart className="size-3.5 text-primary" />
                  <span>Open Campus Match</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 4: Campus Radius & National Discovery (Large 7 Cols) */}
          <div className="md:col-span-7 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <Badge variant="catYellow" className="gap-1.5 text-xs py-1 px-3">
                  <Globe2 className="size-3.5" />
                  <span>Campus Radius Switcher</span>
                </Badge>
                <span className="text-[11px] font-bold text-muted-foreground">1-Tap Scope Toggle</span>
              </div>

              <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                Your Hostel First. All India on Tap.
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Need hyper-local tea? Switch to your college radius. Looking for national hackathon teams, fest invites, or internship referrals? Switch to All-India in one tap.
              </p>

              {/* Interactive Scope Toggle Preview */}
              <div className="mt-5 p-4 rounded-2xl border border-border/70 bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                      setActiveRadius("campus");
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeRadius === "campus"
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-card text-muted-foreground hover:text-foreground border border-border/60"
                    }`}
                  >
                    <GraduationCap className="size-3.5" />
                    <span>My College (Hostel + Campus)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                      setActiveRadius("global");
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeRadius === "global"
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-card text-muted-foreground hover:text-foreground border border-border/60"
                    }`}
                  >
                    <Globe2 className="size-3.5" />
                    <span>All Colleges (India-wide)</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/60 text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>
                    {activeRadius === "campus"
                      ? "Showing 8,400+ students from your verified college hub"
                      : "Showing trending discussions across 1,350+ universities in India"}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {activeRadius === "campus" ? "Local Hub" : "National"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Indexed across 1,350+ college directories
              </span>
              <Link href="/colleges">
                <Button size="sm" variant="secondary" className="text-xs font-bold gap-1">
                  <span>Directory</span>
                  <ArrowRight className="size-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
