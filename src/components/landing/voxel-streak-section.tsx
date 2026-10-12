"use client";

import { MouseEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, MessageSquare, Trophy, Volume2, VolumeX } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export function VoxelStreakSection() {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  // 3D Interactive Spring Motion
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["6deg", "-6deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.pop();
    haptics.medium();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <section id="how-it-works" className="relative py-10 sm:py-20 md:py-24 overflow-hidden bg-background select-none">
      {/* 3D Floating decorative voxel blocks */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <motion.span
          animate={{ y: [0, -10, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 left-[15%] size-3.5 rounded-xs bg-[#22c55e]/30 shadow-xs shadow-emerald-500/20"
        />
        <motion.span
          animate={{ y: [0, 12, 0], rotate: [45, 90, 45] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-28 right-[14%] size-3 rounded-xs bg-amber-400/35 shadow-xs shadow-amber-500/20"
        />
        <motion.span
          animate={{ y: [0, -8, 0], rotate: [0, -45, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-20 left-[12%] size-4 rounded-xs bg-emerald-400/25"
        />
        <motion.span
          animate={{ y: [0, 10, 0], rotate: [0, 90, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-28 right-[18%] size-3 rounded-xs bg-sky-400/30"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Pill Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary mb-2.5 sm:mb-3.5 border border-primary/20">
          <MessageSquare className="size-3.5 text-primary" />
          <span>Real Campus Life • Real Time</span>
        </div>

        {/* Section Heading: Pitchy Viral Copy */}
        <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.12] drop-shadow-xs">
          THE HOSTEL TEA YOU CANNOT FIND{" "}
          <br className="hidden sm:inline" />
          <span className="text-primary">ON LINKEDIN OR INSTAGRAM.</span>
        </h2>

        {/* Subtitle */}
        <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Inside jokes, mess food crises, mid-sem survival panic, and club election drama. Everything real that happens between lectures, captured in high-definition voxel motion.
        </p>

        {/* 2 Symmetrical Stat Pills */}
        <div className="mt-5 sm:mt-8 grid grid-cols-2 gap-2.5 max-w-xs sm:max-w-md mx-auto sm:flex sm:items-center sm:justify-center sm:gap-5">
          {/* Streak Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 rounded-2xl border border-border/80 bg-card/90 p-3 sm:px-5 sm:py-3 shadow-xs backdrop-blur-sm">
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 shrink-0">
              <Flame className="size-4 sm:size-5 fill-amber-500 text-amber-500" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm font-black text-foreground truncate">14-Day Streak</p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground truncate">Campus Fire</p>
            </div>
          </div>

          {/* Level Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 rounded-2xl border border-border/80 bg-card/90 p-3 sm:px-5 sm:py-3 shadow-xs backdrop-blur-sm">
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 shrink-0">
              <Trophy className="size-4 sm:size-5 text-blue-600" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm font-black text-foreground truncate">Top 1% Rank</p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground truncate">4,820 LP</p>
            </div>
          </div>
        </div>

        {/* 3D Interactive Gossiping Voxel Video with Spring Motion & Audio Control */}
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            y: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="relative mt-8 sm:mt-12 mx-auto max-w-2xl cursor-pointer perspective-1000"
        >
          <div className="group relative aspect-video w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/70 bg-card/60 p-1 sm:p-1.5 shadow-xl backdrop-blur-md transition-all hover:border-emerald-500/40 hover:shadow-emerald-500/10">
            <div className="relative size-full overflow-hidden rounded-[18px] sm:rounded-[22px] bg-black">
              <video
                ref={videoRef}
                src="/campusloop/marketing/voxel/videos/gossiping.mp4"
                poster="/campusloop/marketing/voxel/videos/gossiping_poster.webp"
                autoPlay
                loop
                muted={isMuted}
                playsInline
                preload="metadata"
                className="size-full object-cover select-none pointer-events-none"
                aria-label="3D voxel college students chatting and gossiping on campus lawn"
              />

              {/* Subtle Ambient Vignette Overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

              {/* Top Left Live Campus Badge */}
              <div className="pointer-events-none absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-black text-white uppercase tracking-wider backdrop-blur-md">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Hostel Tea &amp; Lawn Vibes</span>
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
                    <span className="text-[11px]">Sound On</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="size-3.5 text-emerald-400" />
                    <span className="text-[11px]">Playing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Micro-CTA link */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/feeds"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <span>See live anonymous confessions from your campus</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
