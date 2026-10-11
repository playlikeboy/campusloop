"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  VenetianMask,
  Vote,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CuteCatMascot, CuteHeart, CuteSparkle } from "@/components/ui/cute-illustrations";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface CuteLandingHeroProps {
  isAuthenticated?: boolean;
}

export function CuteLandingHero({ isAuthenticated = false }: CuteLandingHeroProps) {
  // Interactive Live Poll inside Hero Mockup
  const [selectedPoll, setSelectedPoll] = useState<number | null>(null);
  const [pollVotes, setPollVotes] = useState([68, 32]);

  // Interactive Live Confession Reaction
  const [confessionLikes, setConfessionLikes] = useState(142);
  const [hasLikedConfession, setHasLikedConfession] = useState(false);

  const handlePollVote = (idx: number) => {
    if (selectedPoll !== null) return;
    sounds.ting();
    haptics.medium();
    setSelectedPoll(idx);
    setPollVotes((prev) => {
      const copy = [...prev];
      copy[idx] += 1;
      return copy;
    });
  };

  const handleConfessionLike = () => {
    sounds.pop();
    haptics.light();
    if (!hasLikedConfession) {
      setConfessionLikes((c) => c + 1);
      setHasLikedConfession(true);
    } else {
      setConfessionLikes((c) => c - 1);
      setHasLikedConfession(false);
    }
  };

  const campuses = [
    "BIT Mesra",
    "IIT Delhi",
    "NIT Trichy",
    "BITS Pilani",
    "Delhi University",
    "VIT Vellore",
    "IIIT Hyderabad",
    "SRM Chennai",
    "Manipal",
    "Jadavpur Univ",
  ];

  return (
    <section className="relative w-full overflow-hidden select-none pt-4 sm:pt-8 pb-12 sm:pb-20">
      {/* Soft Ambient Warm Glow */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-canvas/60 rounded-full blur-3xl opacity-70" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Trust Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs backdrop-blur-md mb-5 sm:mb-7">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <ShieldCheck className="size-3.5 text-primary" />
          <span className="font-bold text-foreground">100% Verified Students Only</span>
          <span className="text-muted-foreground/60 hidden sm:inline">·</span>
          <span className="text-muted-foreground hidden sm:inline">Zero Faculty &amp; Zero Recruiters</span>
        </div>

        {/* Baloo 2 Main Headline */}
        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.12] sm:leading-[1.08]">
          Where your campus{" "}
          <br className="hidden sm:inline" />
          <span className="text-primary inline-flex items-center gap-1.5 sm:gap-2">
            secretly connects &amp; shines.
            <CuteSparkle size={28} className="text-primary hidden sm:inline-block animate-bounce" />
          </span>
        </h1>

        {/* Warm & Honest Subtitle */}
        <p className="mt-3.5 sm:mt-5 text-sm sm:text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
          The verified student loop for inside hostel tea, anonymous confessions, 45,000+ solved PYQs, and campus crushes across 1,350+ Indian colleges.
        </p>

        {/* Dual Primary Call to Actions */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md sm:max-w-none mx-auto">
          <Link
            href={isAuthenticated ? "/feeds" : "/sign-up"}
            onClick={() => {
              sounds.pop();
              haptics.medium();
            }}
          >
            <Button size="lg" className="w-full sm:w-auto h-12 px-7 text-sm font-bold gap-2 shadow-sm">
              <Zap className="size-4" />
              <span>{isAuthenticated ? "Enter Campus Feed" : "Join with College Email"}</span>
              <ArrowRight className="size-4" />
            </Button>
          </Link>

          <Link
            href="/colleges"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
          >
            <Button variant="secondary" size="lg" className="w-full sm:w-auto h-12 px-6 text-sm font-bold gap-2">
              <GraduationCap className="size-4 text-primary" />
              <span>Explore 1,350+ Hubs</span>
            </Button>
          </Link>
        </div>

        {/* Interactive Live Campus Deck Preview */}
        <div className="mt-10 sm:mt-14 max-w-xl mx-auto">
          <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 text-left shadow-md space-y-4">
            {/* Header of Preview */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-2xl bg-canvas/50 border border-border/60 flex items-center justify-center">
                  <CuteCatMascot size={34} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-bold text-sm text-foreground">Birla Institute of Technology</span>
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Hostel 7 · Live Campus Timeline</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                <Sparkles className="size-3" />
                <span>Active Now</span>
              </div>
            </div>

            {/* Simulated Live Confession Card */}
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <VenetianMask className="size-3.5 text-primary" />
                  <span>Anonymous Whisper</span>
                  <span className="text-[10px] text-muted-foreground font-normal">· 12m ago</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-catPink/40 border border-catPink/60 text-foreground">
                  Hostel Tea
                </span>
              </div>

              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                &ldquo;Prof gave 3 surprise quizzes this week... whoever uploaded the full handwritten PYQ solution set to the Academic Vault, you literally saved our CGPA! 🙏&rdquo;
              </p>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleConfessionLike}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                    hasLikedConfession
                      ? "border-primary/50 bg-primary/10 text-primary shadow-2xs"
                      : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CuteHeart size={14} className={hasLikedConfession ? "scale-110" : "opacity-80"} />
                  <span>{confessionLikes}</span>
                </button>

                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <MessageSquare className="size-3" />
                  <span>34 comments</span>
                </div>
              </div>
            </div>

            {/* Interactive Live Campus Poll */}
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Vote className="size-3.5 text-primary" />
                <span>Live Campus Poll · Tap to vote</span>
              </div>

              <p className="text-xs sm:text-sm text-foreground font-semibold">
                Where are we hanging out after the 5:00 PM lab?
              </p>

              <div className="space-y-2 pt-1">
                {[
                  { title: "Hostel Chai Tapri & Maggi Point", index: 0 },
                  { title: "Central Library AC Section (Exam Prep)", index: 1 },
                ].map((opt) => {
                  const isVoted = selectedPoll !== null;
                  const total = pollVotes[0] + pollVotes[1];
                  const pct = Math.round((pollVotes[opt.index] / total) * 100);
                  const isSelected = selectedPoll === opt.index;

                  return (
                    <button
                      key={opt.title}
                      type="button"
                      onClick={() => handlePollVote(opt.index)}
                      className={`relative w-full p-2.5 sm:p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer overflow-hidden ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/70 bg-card hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      {/* Vote Progress Bar */}
                      {isVoted && (
                        <div
                          className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-500 rounded-lg"
                          style={{ width: `${pct}%` }}
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="truncate">{opt.title}</span>
                        {isVoted && <span className="font-extrabold text-xs shrink-0 ml-2">{pct}%</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Marquee of 1,350+ Colleges */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-border/60">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Active hubs across 1,350+ Indian colleges &amp; universities
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {campuses.map((campus) => (
              <span
                key={campus}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border/80 text-xs font-bold text-foreground shadow-2xs"
              >
                <GraduationCap className="size-3 text-primary" />
                <span>{campus}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
