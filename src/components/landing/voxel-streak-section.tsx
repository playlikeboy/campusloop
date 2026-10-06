"use client";

import { MouseEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, MessageSquare, Sparkles, Trophy, Volume2, VolumeX } from "lucide-react";
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
    <section id="how-it-works" className="relative py-16 sm:py-24 overflow-hidden bg-background select-none">
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
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-black text-[#16a34a] dark:text-emerald-400 mb-3.5 border border-emerald-500/20">
          <MessageSquare className="size-3.5 text-[#22c55e]" />
          <span>Real Campus Life • Real Time</span>
        </div>

        {/* Section Heading: Pitchy Viral Copy */}
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight drop-shadow-xs">
          THE HOSTEL TEA YOU CANNOT FIND
          <br />
          <span className="text-[#16a34a] dark:text-emerald-400">ON LINKEDIN OR INSTAGRAM.</span>
        </h2>

        {/* Subtitle */}
        <p className="mt-4 text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Inside jokes, mess food crises, mid-sem survival panic, and club election drama. Everything real that happens between lectures, captured in high-definition voxel motion.
        </p>

        {/* 2 Symmetrical Stat Pills with 3D Hover Lift */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          {/* Streak Pill */}
          <motion.div
            whileHover={{ y: -3, scale: 1.04 }}
            className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/90 px-5 py-3 shadow-md shadow-amber-500/5 backdrop-blur-sm transition-shadow cursor-default"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <Flame className="size-5 fill-amber-500 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-foreground">14-Day Streak</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Campus Fire Level</p>
            </div>
          </motion.div>

          {/* Level Pill */}
          <motion.div
            whileHover={{ y: -3, scale: 1.04 }}
            className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/90 px-5 py-3 shadow-md shadow-blue-500/5 backdrop-blur-sm transition-shadow cursor-default"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
              <Trophy className="size-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-foreground">Top 1% Rank</p>
              <p className="text-[11px] font-semibold text-muted-foreground">4,820 Loop Points (LP)</p>
            </div>
          </motion.div>
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
            y: [0, -6, 0],
          }}
          transition={{
            y: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="relative mt-10 sm:mt-14 mx-auto max-w-2xl cursor-pointer perspective-1000"
        >
          <div className="group relative aspect-video w-full overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-1.5 shadow-2xl backdrop-blur-md transition-all hover:border-emerald-500/40 hover:shadow-emerald-500/10">
            <div className="relative size-full overflow-hidden rounded-[22px] bg-black">
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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16a34a] hover:underline cursor-pointer"
          >
            <span>See live anonymous confessions from your campus</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
