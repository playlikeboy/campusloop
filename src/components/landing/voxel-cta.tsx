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
    <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-black text-white select-none">
      {/* Background Video: Full Screen, Edge-to-Edge, Vibrant & Crisp */}
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

        {/* Subtle, non-muddy gradient scrim for text legibility while keeping video fully visible */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Top Controls Bar: Full Width Edge-to-Edge */}
      <div className="relative z-10 w-full flex items-center justify-between gap-4 px-6 sm:px-12 lg:px-16 pt-8 sm:pt-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-black/60 px-4 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md shadow-xs">
          <span className="size-2 rounded-xs bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
          <span className="tracking-wide uppercase text-[11px] font-bold">
            Built for Students • Verified Campus
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
                <span></span>
              </>
            ) : (
              <>
                <VolumeX className="size-3.5" />
                <span></span>
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
                <span className="hidden sm:inline"></span>
              </>
            ) : (
              <>
                <Play className="size-3" />
                <span className="hidden sm:inline"></span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Hero Typographic Body: Full Bleed, Edge-Aligned */}
      <div className="relative z-10 w-full px-6 sm:px-12 lg:px-16 py-12 sm:py-20 text-left max-w-3xl">
        <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[0.92] text-white">
          CONNECT
          <br />
          LEARN
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(192,132,252,0.45)]">
            BEYOND
          </span>
        </h2>

        <p className="mt-6 text-sm sm:text-base text-white/90 max-w-lg font-medium leading-relaxed tracking-wide drop-shadow-sm">
          CampusLoop isn&apos;t just another app. It&apos;s a verified digital campus world. A peer-contributed vault. A living student network where you are never left out of the loop.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Link
            href={isAuthenticated ? "/feeds" : "/sign-up"}
            className="group relative inline-flex items-center justify-center gap-3 rounded-full border border-purple-400/90 bg-black/80 px-8 py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-white backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:border-purple-300 hover:bg-purple-950/60 hover:shadow-[0_0_45px_rgba(168,85,247,0.7)] active:scale-95 transition-all"
          >
            <span>{isAuthenticated ? "Enter Campus Feed" : "Enter The Loop"}</span>
            <ArrowRight className="size-4 text-purple-400 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/colleges"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-4 text-xs sm:text-sm font-bold tracking-wide text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all"
          >
            <Compass className="size-4 text-white/80" />
            <span>Explore Campuses</span>
          </Link>
        </div>
      </div>

      {/* Bottom Bar: Full Width Edge-to-Edge */}
      <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 sm:px-12 lg:px-16 pb-8 pt-6 border-t border-white/15 text-xs text-white/80">
        <div className="flex items-center gap-2 font-medium">
          <Shield className="size-4 text-emerald-400" />
          <span className="uppercase tracking-widest text-[11px] text-white/90">
            The Verified Student Layer • Founded at BIT Mesra
          </span>
        </div>

        <div className="flex items-center gap-4 uppercase tracking-widest text-[11px] font-bold text-white/70">
          <span>Create</span>
          <span>•</span>
          <span>Connect</span>
          <span>•</span>
          <span>Collaborate</span>
        </div>
      </div>
    </section>
  );
}
