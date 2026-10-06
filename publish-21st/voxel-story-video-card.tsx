"use client";

import * as React from "react";
import { GraduationCap, ShieldCheck, Sparkles, Volume2, VolumeX, Zap } from "lucide-react";

export interface VoxelStoryVideoCardProps {
  badgeText?: string;
  badgeIcon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  tags?: string[];
  videoSrc?: string;
  posterSrc?: string;
  videoBadgeText?: string;
  className?: string;
}

export function VoxelStoryVideoCard({
  badgeText = "The Campus Collective",
  badgeIcon: BadgeIcon = GraduationCap,
  title = "Where authentic college friendships take shape.",
  description = "No influencers, no corporate ad trackers, no external toxicity. Just you and your verified batchmates sharing inside jokes, exam prep, semester survival tips, and hostel stories.",
  tags = ["Verified Students Only", "Zero Corporate Ads", "End-to-End Encrypted Anonymity"],
  videoSrc = "https://campusloop.space/campusloop/marketing/voxel/videos/gossiping.mp4",
  posterSrc = "https://campusloop.space/campusloop/marketing/voxel/videos/gossiping_poster.webp",
  videoBadgeText = "Hostel Lore in Motion",
  className = "",
}: VoxelStoryVideoCardProps) {
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
      x: Math.max(-5, Math.min(5, x * 10)),
      y: Math.max(-4, Math.min(4, -y * 8)),
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
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: "transform 0.15s ease-out",
      }}
      className={`relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card/90 to-card/50 p-4 sm:p-8 shadow-xl shadow-primary/5 transition-transform duration-200 ease-out select-none ${className}`}
    >
      <div className="grid gap-6 md:grid-cols-2 items-center">
        {/* Video Player Column */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/60 bg-black/40 shadow-inner group">
          {isCapturing ? (
            <img
              src={posterSrc}
              alt="Campus story preview"
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
              aria-label="Campus story and community video"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15" />

          {/* Top Floating Badge */}
          <span className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{videoBadgeText}</span>
          </span>

          {/* Bottom Audio Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? "Unmute video sound" : "Mute video sound"}
            className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="size-3 text-stone-300" />
                <span>Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="size-3 text-emerald-400 animate-pulse" />
                <span>Playing</span>
              </>
            )}
          </button>
        </div>

        {/* Narrative & Tag Details Column */}
        <div className="space-y-4 text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-bold text-foreground">
            <BadgeIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{badgeText}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"
              >
                <ShieldCheck className="size-3" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
