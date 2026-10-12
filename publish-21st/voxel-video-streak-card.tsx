"use client";

import * as React from "react";
import { Flame, Trophy, Volume2, VolumeX } from "lucide-react";

export interface VoxelVideoStreakCardProps {
  headingPrimary?: string;
  headingHighlight?: string;
  subtitle?: string;
  streakDays?: number;
  streakLabel?: string;
  levelNumber?: number;
  levelLabel?: string;
  videoBadgeText?: string;
  videoSrc?: string;
  posterSrc?: string;
  className?: string;
}

export function VoxelVideoStreakCard({
  headingPrimary = "GROW YOUR CAMPUS",
  headingHighlight = "WITH EVERY CONNECTION.",
  subtitle = "Engage a little every day, earn Loop Points (LP), and complete campus missions to turn college life into a thriving, lasting community.",
  streakDays = 12,
  streakLabel = "Current Streak",
  levelNumber = 38,
  levelLabel = "Total Campus LP",
  videoBadgeText = "Hostel Tea & Vibes",
  videoSrc = "https://campusloop.space/campusloop/marketing/voxel/videos/gossiping.mp4",
  posterSrc = "https://campusloop.space/campusloop/marketing/voxel/videos/gossiping_poster.webp",
  className = "",
}: VoxelVideoStreakCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = React.useState(true);
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
  const [isCapturing, setIsCapturing] = React.useState(() => {
    if (typeof window !== "undefined") {
      return (
        window.location.search.includes("capture=1") ||
        window.location.search.includes("snapshot=1")
      );
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (
        window.location.search.includes("capture=1") ||
        window.location.search.includes("snapshot=1")
      ) {
        setIsCapturing(true);
      }
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: Math.max(-8, Math.min(8, x * 16)),
      y: Math.max(-6, Math.min(6, -y * 12)),
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <section
      className={`relative py-16 sm:py-24 overflow-hidden bg-background select-none ${className}`}
    >
      {/* Decorative ambient floating voxel blocks */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <span className="absolute top-12 left-[15%] size-3.5 rounded-xs bg-emerald-500/30 shadow-xs shadow-emerald-500/20 animate-pulse" />
        <span className="absolute top-28 right-[14%] size-3 rounded-xs bg-amber-400/35 shadow-xs shadow-amber-500/20 animate-bounce" />
        <span className="absolute bottom-20 left-[12%] size-4 rounded-xs bg-emerald-400/25" />
        <span className="absolute bottom-28 right-[18%] size-3 rounded-xs bg-sky-400/30 animate-pulse" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Heading */}
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight drop-shadow-xs">
          {headingPrimary}
          <br />
          <span className="text-emerald-600 dark:text-emerald-400">
            {headingHighlight}
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-4 text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        {/* 2 Symmetrical Stat Pills with Hover Lift */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          {/* Streak Pill */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/90 px-5 py-3 shadow-md shadow-amber-500/5 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg cursor-default">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <Flame className="size-5 fill-amber-500 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-foreground">
                {streakDays} Days
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {streakLabel}
              </p>
            </div>
          </div>

          {/* Level Pill */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/90 px-5 py-3 shadow-md shadow-blue-500/5 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg cursor-default">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
              <Trophy className="size-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-foreground">
                Level {levelNumber}
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {levelLabel}
              </p>
            </div>
          </div>
        </div>

        {/* 3D Interactive Video Card with Mouse Perspective Tilt & Sound Controls */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
            transition: "transform 0.15s ease-out",
          }}
          className="relative mt-10 sm:mt-14 mx-auto max-w-2xl cursor-pointer"
        >
          <div className="group relative aspect-video w-full overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-1.5 shadow-2xl backdrop-blur-md transition-all hover:border-emerald-500/40 hover:shadow-emerald-500/10">
            <div className="relative size-full overflow-hidden rounded-[22px] bg-black">
              {isCapturing ? (
                <img
                  src={posterSrc}
                  alt="3D voxel campus vibe preview"
                  className="size-full object-cover select-none pointer-events-none"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  poster={posterSrc}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                  className="size-full object-cover select-none pointer-events-none"
                  aria-label="3D voxel college students chatting and gossiping on campus lawn"
                />
              )}

              {/* Ambient Vignette Overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

              {/* Top Left Live Campus Badge */}
              <div className="pointer-events-none absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-black text-white uppercase tracking-wider backdrop-blur-md">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{videoBadgeText}</span>
              </div>

              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={toggleSound}
                className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-105 active:scale-95 cursor-pointer"
                title={isMuted ? "Unmute audio" : "Mute audio"}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="size-3.5 text-stone-300" />
                    <span className="text-[11px]">Audio On</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="size-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-[11px]">Playing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
