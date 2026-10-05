"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  Flame,
  Pause,
  Play,
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
      video.play();
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
    <section className="relative w-full min-h-[92vh] sm:min-h-screen flex flex-col justify-between overflow-hidden bg-background select-none pt-4 pb-12 sm:pb-16">
      {/* Background Video: Edge-to-Edge Full Screen, Vibrant & Fully Visible */}
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

        {/* Lightweight translucent scrim ensuring video remains completely visible */}
        <div
          className="absolute inset-0 bg-background/50 dark:bg-black/55 backdrop-blur-[1px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Floating Controls Bar: Top Edge-to-Edge */}
      <div className="relative z-20 w-full flex items-center justify-between px-4 sm:px-8 lg:px-12 pt-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-background/80 dark:bg-black/70 px-3.5 py-1 text-xs font-bold text-[#16a34a] dark:text-emerald-400 backdrop-blur-md shadow-xs">
          <span className="size-2 rounded-xs bg-[#22c55e] animate-pulse" />
          <span className="text-[11px] uppercase tracking-wider">CampusLoop 3D World</span>
        </div>

        {/* Sound Toggle + Video Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? "Unmute hero video sound" : "Mute hero video sound"}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black backdrop-blur-md transition-all cursor-pointer ${
              !isMuted
                ? "border-emerald-500 bg-emerald-500/20 text-[#16a34a] dark:text-emerald-300 shadow-md"
                : "border-border/60 bg-background/80 dark:bg-black/70 text-foreground/80 hover:bg-background"
            }`}
          >
            {!isMuted ? (
              <>
                <Volume2 className="size-3.5 text-[#22c55e] animate-pulse" />
                <span></span>
              </>
            ) : (
              <>
                <VolumeX className="size-3.5 text-muted-foreground" />
                <span></span>
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
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="size-3" />
                <span className="hidden sm:inline">Play</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content: Headline + Primary CTA */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 text-center mt-4 sm:mt-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-[1.08] drop-shadow-sm">
          BUILD YOUR CAMPUS.
          <br />
          <span className="text-[#16a34a] dark:text-emerald-400">ONE DAY AT A TIME.</span>
        </h1>

        <p className="mt-3 text-xs sm:text-sm md:text-base text-foreground/80 font-medium max-w-xl mx-auto leading-relaxed drop-shadow-xs">
          Complete daily missions to connect with verified peers, access lecture notes, earn Loop Points (LP), and build better habits — one semester at a time.
        </p>

        <div className="mt-5 flex justify-center">
          <Link
            href={isAuthenticated ? "/feeds" : "/sign-up"}
            className="inline-flex items-center justify-center rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <span>{isAuthenticated ? "Open Campus Feed" : "Start Exploring"}</span>
          </Link>
        </div>
      </div>

      {/* Central Phone Mockup with 4 Floating Symmetrical Action Cards */}
      <div className="relative z-10 mx-auto w-full max-w-[300px] sm:max-w-[340px] mt-8 sm:mt-10">
        {/* Top-Left: Quick Pulse */}
        <Link
          href="/feeds"
          className="group absolute -left-10 sm:-left-36 top-4 sm:top-6 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/90 p-2.5 sm:p-3.5 shadow-xl shadow-pink-500/10 backdrop-blur-md hover:scale-105 hover:border-pink-500/40 transition-all cursor-pointer max-w-[145px] sm:max-w-[180px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-pink-500/15 text-pink-600">
              <Zap className="size-4" />
            </div>
            <div className="text-left">
              <p className="text-[11px] sm:text-xs font-black text-foreground">Quick Pulse</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Daily trends</p>
            </div>
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Top-Right: Academic Vault */}
        <Link
          href="/academics"
          className="group absolute -right-10 sm:-right-36 top-4 sm:top-6 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/90 p-2.5 sm:p-3.5 shadow-xl shadow-amber-500/10 backdrop-blur-md hover:scale-105 hover:border-amber-500/40 transition-all cursor-pointer max-w-[145px] sm:max-w-[180px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
              <BookOpen className="size-4" />
            </div>
            <div className="text-left">
              <p className="text-[11px] sm:text-xs font-black text-foreground">Academic Vault</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">PYQs &amp; Notes</p>
            </div>
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Bottom-Left: Campus Clubs */}
        <Link
          href="/communities"
          className="group absolute -left-10 sm:-left-36 bottom-6 sm:bottom-10 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/90 p-2.5 sm:p-3.5 shadow-xl shadow-blue-500/10 backdrop-blur-md hover:scale-105 hover:border-blue-500/40 transition-all cursor-pointer max-w-[145px] sm:max-w-[180px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
              <Users className="size-4" />
            </div>
            <div className="text-left">
              <p className="text-[11px] sm:text-xs font-black text-foreground">Campus Clubs</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Find societies</p>
            </div>
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Bottom-Right: Events Radar */}
        <Link
          href="/events"
          className="group absolute -right-10 sm:-right-36 bottom-6 sm:bottom-10 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/90 p-2.5 sm:p-3.5 shadow-xl shadow-rose-500/10 backdrop-blur-md hover:scale-105 hover:border-rose-500/40 transition-all cursor-pointer max-w-[145px] sm:max-w-[180px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600">
              <Flame className="size-4" />
            </div>
            <div className="text-left">
              <p className="text-[11px] sm:text-xs font-black text-foreground">Events Radar</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Fests &amp; Events</p>
            </div>
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Phone Body */}
        <div className="rounded-[2.5rem] border-4 border-foreground/20 bg-card/95 p-3.5 sm:p-4 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
          {/* Phone Speaker Notch */}
          <div className="mx-auto mb-3 h-3 w-16 rounded-full bg-muted flex items-center justify-center">
            <span className="size-1.5 rounded-full bg-foreground/30" />
          </div>

          {/* In-app Header */}
          <div className="flex items-center justify-between px-1 pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-[#22c55e] flex items-center justify-center text-white text-xs font-black shadow-xs">
                JR
              </div>
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground font-semibold">Good Morning,</p>
                <p className="text-xs font-black text-foreground">Jordan R.</p>
              </div>
            </div>
            <div className="relative">
              <Bell className="size-4 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-rose-500" />
            </div>
          </div>

          {/* Progress Card */}
          <div className="mt-3 rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/10 via-background to-background p-3 text-left">
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-md bg-[#22c55e]/20 text-[#16a34a] px-1.5 py-0.5 text-[9px] font-black uppercase">
                  Level 5
                </span>
                <h2 className="mt-1 text-xs font-black text-foreground">Computer Science</h2>
              </div>
              <div className="size-8 rounded-full border-2 border-[#22c55e] flex items-center justify-center text-[10px] font-black text-[#16a34a]">
                72%
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground">360 / 500 LP</span>
              <Link
                href="/feeds"
                className="inline-flex items-center gap-1 text-[10px] font-black text-[#16a34a] hover:underline"
              >
                Continue Mission →
              </Link>
            </div>
          </div>

          {/* Streak Tracker */}
          <div className="mt-3 rounded-2xl border border-border/50 bg-background/80 p-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3 text-muted-foreground" />
                <span>Active Streak</span>
              </span>
              <span className="flex items-center gap-1 text-amber-500">
                <Flame className="size-3.5 fill-amber-500 text-amber-500" />
                <span>12 Days</span>
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between px-1">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day, idx) => (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-muted-foreground">{day}</span>
                  <span
                    className={`size-4 rounded-full flex items-center justify-center text-[8px] font-black ${
                      idx < 5
                        ? "bg-[#22c55e] text-white shadow-xs"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx < 5 ? "✓" : "·"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
