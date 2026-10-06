"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Flame,
  GraduationCap,
  Heart,
  MessageSquare,
  Pause,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface VoxelVocarushHeroProps {
  isAuthenticated?: boolean;
}

export function VoxelVocarushHero({ isAuthenticated = false }: VoxelVocarushHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Interactive Live Poll state inside hero phone mockup
  const [votedOption, setVotedOption] = useState<number | null>(null);
  const [pollVotes, setPollVotes] = useState([74, 26]);

  const handleHeroVote = (optionIdx: number) => {
    if (votedOption !== null) return;
    sounds.ting();
    haptics.medium();
    setVotedOption(optionIdx);
    setPollVotes((prev) => {
      const next = [...prev];
      next[optionIdx] += 1;
      return next;
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, []);

  const togglePlayback = () => {
    sounds.tap();
    haptics.light();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleSound = () => {
    sounds.pop();
    haptics.medium();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <section className="relative w-full min-h-[95vh] sm:min-h-screen flex flex-col justify-between overflow-hidden bg-background select-none pt-4 pb-14 sm:pb-20">
      {/* Background Video: Edge-to-Edge Full Screen, Looping Cloudflare CDN */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          poster="/campusloop/marketing/voxel/videos/hero_poster.webp"
          className="size-full object-cover object-center pointer-events-none scale-100"
          aria-label="Cute 3D voxel campus animated world"
        >
          <source src="/campusloop/marketing/voxel/videos/hero.mp4" type="video/mp4" />
        </video>

        {/* Lightweight translucent scrim ensuring text is 100% readable while video stays vibrant */}
        <div
          className="absolute inset-0 bg-background/55 dark:bg-black/60 backdrop-blur-[1px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Floating Controls Bar: Top Edge-to-Edge */}
      <div className="relative z-20 w-full flex items-center justify-between px-4 sm:px-8 lg:px-12 pt-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-background/85 dark:bg-black/75 px-3.5 py-1 text-xs font-bold text-[#16a34a] dark:text-emerald-400 backdrop-blur-md shadow-xs">
          <span className="size-2 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider">
            100% Verified Students • Zero Outsiders
          </span>
        </div>

        {/* Sound Toggle + Video Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? "Unmute hero video sound" : "Mute hero video sound"}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black backdrop-blur-md transition-all cursor-pointer ${
              !isMuted
                ? "border-emerald-500 bg-emerald-500/20 text-[#16a34a] dark:text-emerald-300 shadow-md shadow-emerald-500/20"
                : "border-border/60 bg-background/80 dark:bg-black/70 text-foreground/80 hover:bg-background"
            }`}
          >
            {!isMuted ? (
              <>
                <Volume2 className="size-3.5 text-[#22c55e] animate-pulse" />
                <span className="text-[11px]">Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="size-3.5 text-muted-foreground" />
                <span className="text-[11px]">Mute</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 dark:bg-black/70 px-3 py-1.5 text-xs font-semibold text-foreground/80 backdrop-blur-md hover:bg-background transition-all cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="size-3" />
                <span className="hidden sm:inline text-[11px]">Pause</span>
              </>
            ) : (
              <>
                <Play className="size-3" />
                <span className="hidden sm:inline text-[11px]">Play</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Pitchy Viral Hero Text */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 text-center mt-4 sm:mt-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-black text-[#16a34a] dark:text-emerald-400 mb-3.5 border border-emerald-500/20">
          <Sparkles className="size-3.5 text-[#22c55e]" />
          <span>The Unfiltered Digital Campus Layer</span>
        </div>

        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl lg:text-7xl max-w-5xl mx-auto leading-[1.05] drop-shadow-sm">
          WHERE YOUR CAMPUS
          <br />
          <span className="text-[#16a34a] dark:text-emerald-400">ACTUALLY TALKS.</span>
        </h1>

        <p className="mt-3.5 text-xs sm:text-base md:text-lg text-foreground/85 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-xs">
          No recruiters. No boomers. No corporate ad tracking. Drop anonymous hostel confessions, download verified semester PYQs, discover campus crushes, and tap the pulse before your 8 AM lecture.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={isAuthenticated ? "/feeds" : "/sign-up"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] px-8 py-4 text-sm font-black text-white shadow-xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <Zap className="size-4" />
            <span>{isAuthenticated ? "Enter Campus Feed" : "Claim Your Campus Handle"}</span>
            <ArrowRight className="size-4" />
          </Link>

          <Link
            href="/colleges"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/85 hover:bg-background px-6 py-4 text-sm font-bold text-foreground backdrop-blur-md shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Compass className="size-4 text-emerald-500" />
            <span>Explore 1,350+ Colleges</span>
          </Link>
        </div>

        {/* Micro Social Proof Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] sm:text-xs font-bold text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="size-3.5 text-[#16a34a]" />
            <span>1,350+ Colleges Live</span>
          </div>
          <span className="text-border">•</span>
          <div className="flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-blue-500" />
            <span>45,000+ Verified Notes &amp; PYQs</span>
          </div>
          <span className="text-border">•</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>100% Student-ID Gated</span>
          </div>
        </div>
      </div>

      {/* Central Phone Mockup with 4 Floating Symmetrical Action Cards */}
      <div className="relative z-10 mx-auto w-full max-w-[310px] sm:max-w-[350px] mt-8 sm:mt-12">
        {/* Top-Left: Anon Confessions */}
        <Link
          href="/feeds"
          className="group absolute -left-12 sm:-left-40 top-3 sm:top-5 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/90 p-2.5 sm:p-3.5 shadow-xl shadow-rose-500/10 backdrop-blur-md hover:scale-105 hover:border-rose-500/40 transition-all cursor-pointer max-w-[150px] sm:max-w-[185px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 shrink-0">
              <MessageSquare className="size-4" />
            </div>
            <div className="text-left">
              <p className="text-[11px] sm:text-xs font-black text-foreground">Anon Confessions</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Hostel lore &amp; tea</p>
            </div>
          </div>
        </Link>

        {/* Top-Right: Academic Vault */}
        <Link
          href="/academics"
          className="group absolute -right-12 sm:-right-40 top-3 sm:top-5 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/90 p-2.5 sm:p-3.5 shadow-xl shadow-blue-500/10 backdrop-blur-md hover:scale-105 hover:border-blue-500/40 transition-all cursor-pointer max-w-[150px] sm:max-w-[185px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 shrink-0">
              <BookOpen className="size-4" />
            </div>
            <div className="text-left">
              <p className="text-[11px] sm:text-xs font-black text-foreground">Academic Vault</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Solved PYQs &amp; Notes</p>
            </div>
          </div>
        </Link>

        {/* Bottom-Left: Campus Match */}
        <Link
          href="/dating"
          className="group absolute -left-12 sm:-left-40 bottom-4 sm:bottom-8 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/90 p-2.5 sm:p-3.5 shadow-xl shadow-pink-500/10 backdrop-blur-md hover:scale-105 hover:border-pink-500/40 transition-all cursor-pointer max-w-[150px] sm:max-w-[185px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-pink-500/15 text-pink-600 shrink-0">
              <Heart className="size-4" />
            </div>
            <div className="text-left">
              <p className="text-[11px] sm:text-xs font-black text-foreground">Campus Match</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Secret crush radar</p>
            </div>
          </div>
        </Link>

        {/* Bottom-Right: Level & Clout */}
        <Link
          href="/feeds"
          className="group absolute -right-12 sm:-right-40 bottom-4 sm:bottom-8 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/90 p-2.5 sm:p-3.5 shadow-xl shadow-amber-500/10 backdrop-blur-md hover:scale-105 hover:border-amber-500/40 transition-all cursor-pointer max-w-[150px] sm:max-w-[185px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 shrink-0">
              <Flame className="size-4" />
            </div>
            <div className="text-left">
              <p className="text-[11px] sm:text-xs font-black text-foreground">Loop Points (LP)</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Level 38 Legend</p>
            </div>
          </div>
        </Link>

        {/* Phone Body with Live Interactive In-App Feed Mockup */}
        <div className="rounded-[2.5rem] border-4 border-foreground/20 bg-card/95 p-3.5 sm:p-4 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
          {/* Phone Speaker Notch */}
          <div className="mx-auto mb-3 h-3 w-16 rounded-full bg-muted flex items-center justify-center">
            <span className="size-1.5 rounded-full bg-foreground/30" />
          </div>

          {/* In-app Header: Active Campus Pulse */}
          <div className="flex items-center justify-between px-1 pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-[#22c55e] flex items-center justify-center text-white text-xs font-black shadow-xs">
                CL
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-foreground">BIT Mesra Hub</span>
                  <span className="size-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                </div>
                <p className="text-[9px] text-muted-foreground font-semibold">2,410 Students Online</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/15 text-[#16a34a] px-2 py-0.5 text-[9px] font-black uppercase">
              Live Feed
            </span>
          </div>

          {/* Trending Ticker */}
          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-muted/50 px-2.5 py-1.5 text-left">
            <TrendingUp className="size-3 text-rose-500 shrink-0" />
            <p className="text-[10px] font-bold text-foreground truncate">
              Trending: &quot;Who unplugged the 3rd floor water cooler?&quot;
            </p>
          </div>

          {/* Interactive Live Mini-Poll Inside the Mockup */}
          <div className="mt-2.5 rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/10 via-background to-background p-3 text-left">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-[#22c55e]/20 text-[#16a34a] px-1.5 py-0.5 text-[8px] font-black uppercase">
                Campus Poll • Tap to Vote
              </span>
              <span className="text-[9px] font-semibold text-muted-foreground">
                {pollVotes[0] + pollVotes[1]} votes
              </span>
            </div>

            <p className="mt-1.5 text-[11px] font-bold text-foreground">
              Waking up for the 8:00 AM lecture tomorrow?
            </p>

            <div className="mt-2 space-y-1.5">
              <button
                type="button"
                onClick={() => handleHeroVote(0)}
                className={`w-full text-left p-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                  votedOption === 0
                    ? "border-emerald-500 bg-emerald-500/20 text-[#16a34a]"
                    : "border-border/60 bg-card hover:border-emerald-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>No chance, sleeping in</span>
                  <span>{pollVotes[0]}%</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleHeroVote(1)}
                className={`w-full text-left p-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                  votedOption === 1
                    ? "border-emerald-500 bg-emerald-500/20 text-[#16a34a]"
                    : "border-border/60 bg-card hover:border-emerald-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Yes, need that 75% attendance</span>
                  <span>{pollVotes[1]}%</span>
                </div>
              </button>
            </div>
          </div>

          {/* Active Streak Tracker Bar */}
          <div className="mt-2.5 rounded-xl border border-border/50 bg-background/80 p-2 flex items-center justify-between text-[10px] font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Flame className="size-3.5 fill-amber-500 text-amber-500" />
              <span>12-Day Campus Fire Streak</span>
            </span>
            <span className="text-[#16a34a] font-black">+50 LP Daily</span>
          </div>
        </div>
      </div>
    </section>
  );
}
