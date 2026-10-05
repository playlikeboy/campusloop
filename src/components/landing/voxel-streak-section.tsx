"use client";

import { MouseEvent, useRef } from "react";
import Image from "next/image";
import { Flame, Trophy } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

export function VoxelStreakSection() {
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Interactive Spring Motion
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

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
        {/* Section Heading */}
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight drop-shadow-xs">
          GROW YOUR CAMPUS
          <br />
          <span className="text-[#16a34a] dark:text-emerald-400">WITH EVERY CONNECTION.</span>
        </h2>

        {/* Subtitle */}
        <p className="mt-4 text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Engage a little every day, earn Loop Points (LP), and complete campus missions to turn college life into a thriving, lasting community.
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
              <p className="text-sm font-black text-foreground">12 Days</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Current Streak</p>
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
              <p className="text-sm font-black text-foreground">Level 38</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Total Campus LP</p>
            </div>
          </motion.div>
        </div>

        {/* 3 Cute Voxel Characters: Interactive 3D Perspective Tilt & Floating Movement */}
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
            y: [0, -7, 0],
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
          <div className="relative aspect-16/10 w-full overflow-hidden drop-shadow-2xl">
            <Image
              src="/campusloop/marketing/voxel/cute-students-trio.webp"
              alt="Three cute voxel college student characters standing together on grass blocks"
              fill
              sizes="(max-width: 768px) 100vw, 700px"
              priority
              className="object-contain object-bottom select-none pointer-events-none"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
