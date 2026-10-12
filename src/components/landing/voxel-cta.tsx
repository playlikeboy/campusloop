"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Pause,
  Play,
  Shield,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface VoxelCTAProps {
  isAuthenticated?: boolean;
}

export function VoxelCTA({ isAuthenticated = false }: VoxelCTAProps) {
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
    <section className="relative w-full min-h-[auto] sm:min-h-[85vh] lg:min-h-screen flex flex-col justify-between overflow-hidden bg-black text-white select-none">
      {/* Background Video: Full Screen, Edge-to-Edge, Vibrant Cloudflare CDN */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          poster="/campusloop/marketing/voxel/videos/poster.webp"
          className="size-full object-cover object-center pointer-events-none scale-100"
        >
          <source
            src="/campusloop/marketing/voxel/videos/video2_optimized.mp4"
            type="video/mp4"
          />
          <source
            src="/campusloop/marketing/voxel/videos/video2.mp4"
            type="video/mp4"
          />
        </video>

        {/* Non-muddy gradient scrim for text legibility while keeping video vibrant */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Top Controls Bar: Full Width Edge-to-Edge */}
      <div className="relative z-10 w-full flex items-center justify-between gap-3 px-4 sm:px-12 lg:px-16 pt-6 sm:pt-12">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-500/30 bg-black/60 px-3 sm:px-4 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md shadow-xs">
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse shrink-0" />
          <span className="tracking-wide uppercase text-[10px] sm:text-[11px] font-black truncate max-w-[180px] sm:max-w-none">
            1,350+ Campuses Live
          </span>
        </div>

        {/* Media Controls: Sound Toggle + Play/Pause */}
        <div className="flex items-center gap-2">
          {/* Sound On/Off Button */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? "Turn sound on" : "Turn sound off"}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 sm:px-3.5 py-1.5 min-h-[36px] text-xs font-bold backdrop-blur-md transition-all cursor-pointer ${
              !isMuted
                ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                : "border-white/20 bg-black/60 text-white/80 hover:bg-black/90 hover:text-white"
            }`}
          >
            {!isMuted ? (
              <>
                <Volume2 className="size-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[10px] sm:text-[11px]">Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="size-3.5" />
                <span className="text-[10px] sm:text-[11px]">Mute</span>
              </>
            )}
          </button>

          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause background video" : "Play background video"}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 sm:px-3.5 py-1.5 min-h-[36px] text-xs font-medium text-white/80 backdrop-blur-md hover:bg-black/90 hover:text-white transition-all cursor-pointer"
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

      {/* Main Typographic Body: Punchy Viral Closer */}
      <div className="relative z-10 w-full px-4 sm:px-12 lg:px-16 py-8 sm:py-16 text-left max-w-3xl">
        <h2 className="text-3xl sm:text-6xl lg:text-8xl font-black uppercase tracking-tight leading-[0.98] sm:leading-[0.92] text-white">
          YOUR BATCH
          <br />
          IS ALREADY
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(52,211,153,0.45)]">
            IN THE LOOP.
          </span>
        </h2>

        <p className="mt-4 sm:mt-6 text-xs sm:text-base text-white/90 max-w-lg font-medium leading-relaxed tracking-wide drop-shadow-sm">
          Stop digging through buried WhatsApp documents and dead Discord servers. Claim your verified student handle, drop into your college hub, and never miss what happens on campus again.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Link
            href={isAuthenticated ? "/feeds" : "/sign-up"}
            onClick={() => {
              sounds.tap();
              haptics.medium();
            }}
            className="group relative inline-flex items-center justify-center gap-2.5 rounded-full border border-primary/90 bg-primary px-6 sm:px-8 py-3.5 sm:py-4 min-h-[48px] text-xs sm:text-sm font-bold tracking-wide text-primary-foreground backdrop-blur-xl shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/40 active:scale-95 transition-all cursor-pointer"
          >
            <Zap className="size-4" />
            <span>{isAuthenticated ? "Enter Campus Feed" : "Claim Your Campus Handle"}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/colleges"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 sm:px-7 py-3.5 sm:py-4 min-h-[48px] text-xs sm:text-sm font-bold tracking-wide text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <Compass className="size-4 text-white/80" />
            <span>Explore 1,350+ Campuses</span>
          </Link>
        </div>
      </div>

      {/* Bottom Bar: Full Width Edge-to-Edge */}
      <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-12 lg:px-16 pb-6 sm:pb-8 pt-4 sm:pt-6 border-t border-white/15 text-xs text-white/80">
        <div className="flex items-center gap-2 font-medium">
          <Shield className="size-4 text-emerald-400 shrink-0" />
          <span className="uppercase tracking-widest text-[10px] sm:text-[11px] text-white/90">
            The Verified Student Layer • Founded at BIT Mesra • Gated by .ac.in
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 uppercase tracking-widest text-[10px] sm:text-[11px] font-bold text-white/70">
          <span>Unfiltered</span>
          <span>•</span>
          <span>Verified</span>
          <span>•</span>
          <span>Encrypted</span>
        </div>
      </div>
    </section>
  );
}
