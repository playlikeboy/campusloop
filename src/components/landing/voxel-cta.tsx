"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, Pause, Play, Shield } from "lucide-react";

interface VoxelCTAProps {
  isAuthenticated?: boolean;
}

export function VoxelCTA({ isAuthenticated = false }: VoxelCTAProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Autoplay handling with fallback
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
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section className="py-14 sm:py-20 lg:py-24 border-t border-border/40 bg-black/95">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Cinematic Portal Card inspired by Minecraft / Voxel Fantasy world */}
        <div className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] overflow-hidden rounded-[2.5rem] border border-purple-500/30 bg-black p-6 sm:p-10 lg:p-14 text-white shadow-2xl shadow-purple-950/50 flex flex-col justify-between">
          {/* Background Video */}
          <div className="absolute inset-0 z-0">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              poster="/campusloop/marketing/voxel/videos/poster.webp"
              className="size-full object-cover object-center pointer-events-none scale-105"
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

            {/* Cinematic Gradient Vignettes for text legibility and portal mood */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 via-45% to-black/30 lg:to-transparent"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60"
              aria-hidden="true"
            />

            {/* Glowing neon portal atmospheric rings */}
            <div
              className="pointer-events-none absolute -left-20 top-1/4 size-96 rounded-full bg-purple-600/20 blur-[100px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute right-10 bottom-10 size-80 rounded-full bg-emerald-500/15 blur-[90px]"
              aria-hidden="true"
            />
          </div>

          {/* Top Bar: Eyebrow + Video Control */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-black/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md shadow-xs">
              <span className="size-2 rounded-xs bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
              <span className="tracking-wide uppercase text-[11px] font-bold">
                Built for Students • Verified Campus
              </span>
            </div>

            {/* Play/Pause subtle glass button */}
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={isPlaying ? "Pause background video" : "Play background video"}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-md hover:bg-black/80 hover:text-white transition-all cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="size-3" />
                  <span className="hidden sm:inline">Pause Ambient</span>
                </>
              ) : (
                <>
                  <Play className="size-3" />
                  <span className="hidden sm:inline">Play Ambient</span>
                </>
              )}
            </button>
          </div>

          {/* Main Hero Typographic Section */}
          <div className="relative z-10 max-w-xl py-10 sm:py-14 text-left">
            {/* Massive 3-line stacked headline matching reference artwork */}
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95] text-white">
              CONNECT
              <br />
              LEARN
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(192,132,252,0.4)]">
                BEYOND
              </span>
            </h2>

            {/* Supporting Copy */}
            <p className="mt-5 text-xs sm:text-sm text-white/80 max-w-md font-medium leading-relaxed tracking-wide">
              CampusLoop isn&apos;t just another app. It&apos;s a verified digital campus world. A peer-contributed vault. A living student network where you are never left out of the loop.
            </p>

            {/* Actions: Neon Glowing Portal Button */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                href={isAuthenticated ? "/feeds" : "/sign-up"}
                className="group relative inline-flex items-center justify-center gap-3 rounded-full border border-purple-400/80 bg-black/70 px-8 py-4 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:border-purple-300 hover:bg-purple-950/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] active:scale-95 transition-all"
              >
                <span>{isAuthenticated ? "Enter Campus Feed" : "Enter The Loop"}</span>
                <ArrowRight className="size-4 text-purple-400 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-4 text-xs sm:text-sm font-semibold tracking-wide text-white/90 backdrop-blur-md hover:bg-white/10 active:scale-95 transition-all"
              >
                <Compass className="size-4 text-white/70" />
                <span>Explore Campuses</span>
              </Link>
            </div>
          </div>

          {/* Bottom Bar: Lore & Navigation tags */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-white/15 text-[11px] text-white/70">
            <div className="flex items-center gap-2 font-medium">
              <Shield className="size-3.5 text-emerald-400" />
              <span className="uppercase tracking-widest text-[10px] text-white/80">
                The Verified Student Layer • Founded at BIT Mesra
              </span>
            </div>

            <div className="flex items-center gap-3 uppercase tracking-widest text-[10px] font-semibold text-white/60">
              <span>Create</span>
              <span>•</span>
              <span>Connect</span>
              <span>•</span>
              <span>Collaborate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
