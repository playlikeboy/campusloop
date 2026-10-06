"use client";

import * as React from "react";
import {
  ArrowRight,
  Compass,
  Pause,
  Play,
  Shield,
  Volume2,
  VolumeX,
} from "lucide-react";

export interface VoxelPortalCTAProps {
  badgeText?: string;
  headlineFirst?: string;
  headlineSecond?: string;
  headlineHighlight?: string;
  description?: string;
  primaryActionText?: string;
  primaryActionHref?: string;
  secondaryActionText?: string;
  secondaryActionHref?: string;
  footerBadgeText?: string;
  footerPillars?: string[];
  videoSrc?: string;
  posterSrc?: string;
  className?: string;
}

export function VoxelPortalCTA({
  badgeText = "Built for Students • Verified Campus",
  headlineFirst = "CONNECT",
  headlineSecond = "LEARN",
  headlineHighlight = "BEYOND",
  description = "A verified digital campus world. A peer-contributed vault. A living student network where you are never left out of the loop.",
  primaryActionText = "Enter The Loop",
  primaryActionHref = "#join",
  secondaryActionText = "Explore Campuses",
  secondaryActionHref = "#campuses",
  footerBadgeText = "The Verified Student Layer • Founded at BIT Mesra",
  footerPillars = ["Create", "Connect", "Collaborate"],
  videoSrc = "https://campusloop.space/campusloop/marketing/voxel/videos/video2_optimized.mp4",
  posterSrc = "https://campusloop.space/campusloop/marketing/voxel/videos/poster.webp",
  className = "",
}: VoxelPortalCTAProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isMuted, setIsMuted] = React.useState(true);
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
        return;
      }
    }

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
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      video.play().catch(() => {});
    }
  };

  return (
    <section
      className={`relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-black text-white select-none ${className}`}
    >
      {/* Background Video or Instant Preview */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {isCapturing ? (
          <img
            src={posterSrc}
            alt="3D voxel portal background"
            className="size-full object-cover object-center pointer-events-none scale-100"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
            poster={posterSrc}
            className="size-full object-cover object-center pointer-events-none scale-100"
            aria-label="3D voxel portal cinematic background video"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}

        {/* Ambient gradient scrims */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Top Controls Bar: Full Width Edge-to-Edge */}
      <div className="relative z-10 w-full flex items-center justify-between gap-4 px-6 sm:px-12 lg:px-16 pt-8 sm:pt-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-black/60 px-4 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md shadow-xs">
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
          <span className="tracking-wide uppercase text-[11px] font-bold">
            {badgeText}
          </span>
        </div>

        {/* Media Controls: Sound Toggle + Play/Pause */}
        <div className="flex items-center gap-2">
          {/* Sound On/Off Button */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? "Turn sound on" : "Turn sound off"}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold backdrop-blur-md transition-all cursor-pointer ${
              !isMuted
                ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                : "border-white/20 bg-black/60 text-white/80 hover:bg-black/90 hover:text-white"
            }`}
          >
            {!isMuted ? (
              <>
                <Volume2 className="size-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[11px]">Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="size-3.5" />
                <span className="text-[11px]">Mute</span>
              </>
            )}
          </button>

          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause background video" : "Play background video"}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md hover:bg-black/90 hover:text-white transition-all cursor-pointer"
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

      {/* Main Typographic Body */}
      <div className="relative z-10 w-full px-6 sm:px-12 lg:px-16 py-12 sm:py-20 text-left max-w-3xl">
        <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[0.92] text-white">
          {headlineFirst}
          <br />
          {headlineSecond}
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(192,132,252,0.45)]">
            {headlineHighlight}
          </span>
        </h2>

        <p className="mt-6 text-sm sm:text-base text-white/90 max-w-lg font-medium leading-relaxed tracking-wide drop-shadow-sm">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <a
            href={primaryActionHref}
            className="group relative inline-flex items-center justify-center gap-3 rounded-full border border-purple-400/90 bg-black/80 px-8 py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-white backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:border-purple-300 hover:bg-purple-950/60 hover:shadow-[0_0_45px_rgba(168,85,247,0.7)] active:scale-95 transition-all"
          >
            <span>{primaryActionText}</span>
            <ArrowRight className="size-4 text-purple-400 transition-transform group-hover:translate-x-1" />
          </a>

          <a
            href={secondaryActionHref}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-4 text-xs sm:text-sm font-bold tracking-wide text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all"
          >
            <Compass className="size-4 text-white/80" />
            <span>{secondaryActionText}</span>
          </a>
        </div>
      </div>

      {/* Bottom Bar: Full Width Edge-to-Edge */}
      <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 sm:px-12 lg:px-16 pb-8 pt-6 border-t border-white/15 text-xs text-white/80">
        <div className="flex items-center gap-2 font-medium">
          <Shield className="size-4 text-emerald-400" />
          <span className="uppercase tracking-widest text-[11px] text-white/90">
            {footerBadgeText}
          </span>
        </div>

        <div className="flex items-center gap-3 uppercase tracking-widest text-[11px] font-bold text-white/70">
          {footerPillars.map((pillar, idx) => (
            <React.Fragment key={pillar}>
              {idx > 0 && <span>•</span>}
              <span>{pillar}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
