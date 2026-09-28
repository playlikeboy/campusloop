"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Send,
  Share2,
  ShieldCheck,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface CreativeHeroProps {
  isAuthenticated?: boolean;
}

type PhoneTab = "feed" | "stories" | "chat" | "match";

export function CreativeHero({ isAuthenticated = false }: CreativeHeroProps) {
  const [activeTab, setActiveTab] = useState<PhoneTab>("feed");
  const [likesCount, setLikesCount] = useState(1240);
  const [hasLiked, setHasLiked] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<number | null>(null);
  const [matchLiked, setMatchLiked] = useState(false);

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    sounds.pop();
    haptics.medium();

    if (!hasLiked) {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
      try {
        confetti({
          particleCount: 28,
          spread: 45,
          origin: { y: 0.65 },
          colors: ["#00d285", "#ff5376", "#7c3aed"],
        });
      } catch {}
    } else {
      setLikesCount((prev) => prev - 1);
      setHasLiked(false);
    }
  }

  function handlePollVote(index: number) {
    sounds.tap();
    haptics.light();
    setSelectedPoll(index);
  }

  return (
    <section className="relative overflow-hidden pt-8 sm:pt-14 pb-16 sm:pb-24 select-none">
      {/* Ambient background glow orbs */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[400px] bg-emerald-500/10 dark:bg-emerald-500/8 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-44 left-1/4 w-[280px] h-[280px] bg-purple-500/10 dark:bg-purple-500/8 blur-[90px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative">
        {/* Top Kicker Pill */}
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <span>1,350+ Verified Indian Campuses Active</span>
          </div>
        </div>

        {/* Main Title & Minimal Subtitle */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5 sm:space-y-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.08]">
            Your campus,{" "}
            <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-purple-600 bg-clip-text text-transparent">
              unhinged & alive.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto font-medium leading-relaxed">
            No professors. No parents. Just verified students sharing real confessions, 24-hour campus vibes, semester PYQs, and daily buzz.
          </p>

          {/* Quick Action Triggers */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/feeds"
              onClick={() => {
                sounds.tap();
                haptics.medium();
              }}
              className="inline-flex h-11 sm:h-12 items-center gap-2 rounded-full bg-primary px-6 sm:px-8 text-xs sm:text-sm font-black text-white hover:opacity-95 active:scale-95 transition-all shadow-md shadow-emerald-500/25 cursor-pointer"
            >
              <span>{isAuthenticated ? "Open Your Campus" : "Claim Your College"}</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/colleges"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="inline-flex h-11 sm:h-12 items-center gap-2 rounded-full border border-border/80 bg-card/80 backdrop-blur-md px-5 sm:px-6 text-xs sm:text-sm font-bold text-foreground hover:bg-muted/70 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <Compass className="size-4 text-primary" />
              <span>Explore Campuses</span>
            </Link>
          </div>
        </div>

        {/* ─── Centerpiece: Mobile Phone Interactive Device Mockup ─── */}
        <div className="mt-10 sm:mt-14 relative max-w-[380px] sm:max-w-[420px] mx-auto">
          {/* Floating Delights Left & Right (Desktop only) */}
          <div className="hidden lg:flex flex-col gap-3 absolute -left-48 top-16 z-20">
            <div className="neo-card p-3.5 rounded-2xl flex items-center gap-3 shadow-md animate-in fade-in duration-500">
              <div className="size-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                🎭
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-foreground">Zero-Log Anon</p>
                <p className="text-[10px] text-muted-foreground">True campus confessions</p>
              </div>
            </div>

            <div className="neo-card p-3.5 rounded-2xl flex items-center gap-3 shadow-md">
              <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                <ShieldCheck className="size-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-foreground">Verified Email Only</p>
                <p className="text-[10px] text-muted-foreground">100% student network</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-3 absolute -right-48 top-28 z-20">
            <div className="neo-card p-3.5 rounded-2xl flex items-center gap-3 shadow-md">
              <div className="size-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
                <Heart className="size-5 fill-rose-500 text-rose-500" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-foreground">Campus Match</p>
                <p className="text-[10px] text-muted-foreground">Dating & peer connects</p>
              </div>
            </div>

            <div className="neo-card p-3.5 rounded-2xl flex items-center gap-3 shadow-md">
              <div className="size-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                📚
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-foreground">Notes & PYQ Vault</p>
                <p className="text-[10px] text-muted-foreground">Save mid-semester GPAs</p>
              </div>
            </div>
          </div>

          {/* Outer Phone Shell */}
          <div className="rounded-[40px] sm:rounded-[46px] p-2.5 sm:p-3 bg-linear-to-b from-border/70 via-border/40 to-border/70 shadow-2xl ring-1 ring-border/60">
            <div className="rounded-[34px] sm:rounded-[40px] bg-card border border-border/50 overflow-hidden shadow-inner flex flex-col min-h-[580px] sm:min-h-[620px]">
              {/* Phone Status Bar + Dynamic Island */}
              <div className="h-10 px-6 pt-2.5 flex items-center justify-between text-muted-foreground text-[11px] font-bold shrink-0">
                <span>9:41</span>
                <div className="h-4 w-20 rounded-full bg-foreground/90 mx-auto" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px]">5G</span>
                  <div className="w-5 h-2.5 rounded-sm border border-muted-foreground/70 p-0.5 flex items-center">
                    <div className="w-full h-full bg-primary rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Phone App Header */}
              <div className="px-4 py-2 flex items-center justify-between border-b border-border/30 shrink-0">
                <div>
                  <h3 className="text-sm font-black text-foreground">CampusLoop</h3>
                  <p className="text-[10px] text-muted-foreground">IIT Bombay • Hub</p>
                </div>

                {/* Segmented Phone Tabs */}
                <div className="flex items-center p-1 rounded-full bg-muted/50 border border-border/30 gap-0.5">
                  {(["feed", "stories", "chat", "match"] as PhoneTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        sounds.tap();
                        haptics.light();
                        setActiveTab(tab);
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all cursor-pointer",
                        activeTab === tab
                          ? "bg-secondary text-white shadow-2xs font-black"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Screen Viewport */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-pastel-mesh">
                <AnimatePresence mode="wait">
                  {/* ── Tab 1: News Feed ── */}
                  {activeTab === "feed" && (
                    <motion.div
                      key="feed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      {/* Post 1: Image Feed Card */}
                      <article className="neo-card p-3 rounded-[24px] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-linear-to-tr from-amber-400 via-rose-500 to-purple-600 p-0.5 shrink-0">
                              <img
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80"
                                alt="Author"
                                className="size-full rounded-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-black text-foreground">Ben Reid</span>
                                <BadgeCheck className="size-3.5 text-[#1D9BF0]" />
                              </div>
                              <p className="text-[10px] text-muted-foreground">Powai, Mumbai • 12m ago</p>
                            </div>
                          </div>
                          <span className="size-7 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
                            <MoreHorizontal className="size-3.5" />
                          </span>
                        </div>

                        {/* Image Showcase */}
                        <div className="relative aspect-4/3 rounded-[20px] overflow-hidden bg-muted">
                          <img
                            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80"
                            alt="Campus vibe"
                            className="size-full object-cover"
                          />
                        </div>

                        {/* Interactive Floating Reaction Pill */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="neo-reaction-pill">
                            <button
                              type="button"
                              onClick={handleLike}
                              className={cn(
                                "flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer",
                                hasLiked ? "text-rose-500" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Heart className={cn("size-3.5", hasLiked && "fill-rose-500 scale-110")} />
                              <span>{likesCount}</span>
                            </button>

                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                              <MessageCircle className="size-3.5" />
                              <span>55</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                              <Share2 className="size-3.5" />
                              <span>8k</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Trending
                          </span>
                        </div>
                      </article>

                      {/* Post 2: Interactive Campus Micro Poll */}
                      <article className="neo-card p-3 rounded-[24px] space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-muted flex items-center justify-center text-xs font-black">
                            🎭
                          </div>
                          <div>
                            <span className="text-[11px] font-black text-foreground">Anonymous Confession</span>
                            <p className="text-[9px] text-muted-foreground">IITB Computer Science • 18m ago</p>
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-foreground">
                          Poll: Should 8:30 AM Saturday lab lectures be strictly illegal?
                        </p>

                        <div className="space-y-1.5 pt-1">
                          {[
                            { text: "100% Illegal (let me sleep)", votes: 93 },
                            { text: "I enjoy suffering", votes: 7 },
                          ].map((opt, i) => (
                            <button
                              key={opt.text}
                              type="button"
                              onClick={() => handlePollVote(i)}
                              className={cn(
                                "w-full p-2 rounded-xl text-left text-xs font-bold transition-all relative overflow-hidden cursor-pointer border",
                                selectedPoll === i
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/40 bg-muted/40 hover:bg-muted/70 text-foreground"
                              )}
                            >
                              {selectedPoll !== null && (
                                <div
                                  className="absolute inset-y-0 left-0 bg-primary/20 transition-all duration-500"
                                  style={{ width: `${opt.votes}%` }}
                                />
                              )}
                              <div className="relative flex items-center justify-between">
                                <span>{opt.text}</span>
                                {selectedPoll !== null && <span>{opt.votes}%</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </article>
                    </motion.div>
                  )}

                  {/* ── Tab 2: Campus Stories / Vibes ── */}
                  {activeTab === "stories" && (
                    <motion.div
                      key="stories"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      {/* Story Avatar Rail */}
                      <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div className="size-13 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center bg-primary/10 text-primary">
                            <Plus className="size-5" />
                          </div>
                          <span className="text-[10px] font-bold text-foreground">You</span>
                        </div>

                        {[
                          { name: "Maisy", time: "1m ago", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80" },
                          { name: "Wells", time: "5m ago", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80" },
                          { name: "Hope", time: "12m ago", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80" },
                        ].map((s) => (
                          <div key={s.name} className="flex flex-col items-center gap-1 shrink-0">
                            <div className="size-13 rounded-full p-0.5 bg-linear-to-tr from-amber-400 via-rose-500 to-purple-600">
                              <img src={s.img} alt={s.name} className="size-full rounded-full object-cover" />
                            </div>
                            <span className="text-[10px] font-bold text-foreground">{s.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Featured Vibe Fullscreen Card */}
                      <div className="relative aspect-3/4 rounded-[28px] overflow-hidden bg-slate-900 shadow-md">
                        <img
                          src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&q=80"
                          alt="Story full"
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/30 p-3.5 flex flex-col justify-between text-white">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black">Hostel 14 Sunset Jam</span>
                            <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">
                              🎵 Heat Waves
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold leading-tight">
                              Jamming with the acoustic club before end-sems kick in 🔥
                            </p>
                            <button
                              type="button"
                              onClick={handleLike}
                              className="size-9 rounded-full bg-rose-500/80 backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-90"
                            >
                              <Heart className="size-4 fill-white text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Tab 3: Chat / DMs ── */}
                  {activeTab === "chat" && (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      {/* Active Contact Header */}
                      <div className="neo-card p-2.5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <img
                              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80"
                              alt="Hope"
                              className="size-8 rounded-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">Hope Young</p>
                            <p className="text-[9px] text-emerald-500 font-bold">Active in Campus</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="size-7 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <Video className="size-3.5" />
                          </span>
                          <span className="size-7 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <Phone className="size-3.5" />
                          </span>
                        </div>
                      </div>

                      {/* Chat Bubbles */}
                      <div className="space-y-2 pt-2 text-xs">
                        <div className="flex justify-start">
                          <div className="chat-bubble-lilac max-w-[80%] p-2.5 rounded-2xl text-foreground font-medium">
                            Hey! Are you studying in the central library right now?
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <div className="chat-bubble-peach max-w-[80%] p-2.5 rounded-2xl text-foreground font-semibold">
                            Yes! Grabbed table 4. Sent you the Compiler Design PYQ notes too.
                          </div>
                        </div>

                        <div className="flex justify-start">
                          <div className="chat-bubble-lilac max-w-[80%] p-2.5 rounded-2xl text-foreground font-medium flex items-center gap-2">
                            <span>Saved my life. Coffee on me!</span>
                            <Heart className="size-3.5 fill-rose-500 text-rose-500 shrink-0" />
                          </div>
                        </div>
                      </div>

                      {/* Chat Input Bar */}
                      <div className="pt-2 flex items-center gap-2">
                        <div className="flex-1 h-9 rounded-full bg-muted/60 px-3.5 flex items-center text-xs text-muted-foreground border border-border/40">
                          Type message...
                        </div>
                        <div className="size-9 rounded-full bg-secondary text-white flex items-center justify-center shadow-xs">
                          <Send className="size-3.5" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Tab 4: Campus Match ── */}
                  {activeTab === "match" && (
                    <motion.div
                      key="match"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      <div className="relative aspect-4/5 rounded-[28px] overflow-hidden bg-slate-900 shadow-md">
                        <img
                          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80"
                          alt="Match profile"
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent p-4 flex flex-col justify-end text-white space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-base font-black">Aanya, 20</h4>
                              <p className="text-[11px] text-zinc-300">Design & AI • 3rd Year</p>
                            </div>
                            <span className="text-[10px] font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                              94% Match
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {["Overthinks Playlists", "Hackathons", "Filter Coffee"].map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Match Actions */}
                      <div className="flex items-center justify-center gap-4 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.tap();
                            haptics.light();
                          }}
                          className="size-11 rounded-full bg-card border border-border/70 flex items-center justify-center text-muted-foreground shadow-xs cursor-pointer hover:bg-muted"
                        >
                          ✕
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.pop();
                            haptics.medium();
                            setMatchLiked((prev) => !prev);
                            try {
                              confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
                            } catch {}
                          }}
                          className={cn(
                            "size-13 rounded-full flex items-center justify-center shadow-lg transition-transform cursor-pointer active:scale-95",
                            matchLiked
                              ? "bg-rose-600 text-white shadow-rose-600/40 scale-105"
                              : "bg-rose-500 text-white shadow-rose-500/30"
                          )}
                        >
                          <Heart className="size-6 fill-white" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Home Indicator Bar */}
              <div className="h-4 flex items-center justify-center pb-1 shrink-0">
                <div className="w-20 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
