"use client";

import * as React from "react";
import { Check, GraduationCap, Heart, RotateCcw, Sparkles, X } from "lucide-react";

export interface SwipeCardProfile {
  id: string;
  name: string;
  age: number;
  college: string;
  course: string;
  bio: string;
  interests: string[];
  photos: string[];
  verified?: boolean;
}

export interface SwipeCardDeckProps {
  profiles: SwipeCardProfile[];
  onSwipe?: (profileId: string, direction: "like" | "pass") => void;
  className?: string;
}

export function SwipeCardDeck({
  profiles: initialProfiles,
  onSwipe,
  className = "",
}: SwipeCardDeckProps) {
  const [profiles, setProfiles] = React.useState<SwipeCardProfile[]>(initialProfiles);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [exitDirection, setExitDirection] = React.useState<"like" | "pass" | null>(null);

  const currentProfile = profiles[currentIndex];

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const completeSwipe = (direction: "like" | "pass") => {
    setExitDirection(direction);
    onSwipe?.(currentProfile.id, direction);

    setTimeout(() => {
      setExitDirection(null);
      setDragOffset({ x: 0, y: 0 });
      setActivePhotoIdx(0);
      setCurrentIndex((prev) => prev + 1);
    }, 250);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragOffset.x > 100) {
      completeSwipe("like");
    } else if (dragOffset.x < -100) {
      completeSwipe("pass");
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProfile) return;
    setActivePhotoIdx((prev) => (prev + 1) % currentProfile.photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProfile) return;
    setActivePhotoIdx((prev) =>
      prev === 0 ? currentProfile.photos.length - 1 : prev - 1
    );
  };

  const resetDeck = () => {
    setCurrentIndex(0);
    setActivePhotoIdx(0);
    setDragOffset({ x: 0, y: 0 });
  };

  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <div
        className={`flex min-h-[460px] w-full max-w-sm flex-col items-center justify-center rounded-3xl border border-border/80 bg-card p-6 text-center shadow-lg select-none ${className}`}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Sparkles className="size-6" />
        </div>
        <h3 className="text-lg font-black text-foreground">You&apos;re All Caught Up!</h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-xs">
          You have reviewed all available profiles for your campus radar.
        </p>
        <button
          type="button"
          onClick={resetDeck}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
          <span>Reset Deck</span>
        </button>
      </div>
    );
  }

  const rotation = dragOffset.x * 0.08;
  const likeOpacity = Math.min(Math.max((dragOffset.x - 30) / 70, 0), 1);
  const nopeOpacity = Math.min(Math.max((-dragOffset.x - 30) / 70, 0), 1);

  return (
    <div className={`relative w-full max-w-sm select-none ${className}`}>
      {/* Background card preview */}
      {currentIndex + 1 < profiles.length && (
        <div className="absolute inset-0 translate-y-3 scale-95 rounded-3xl border border-border/60 bg-muted/40 shadow-sm" />
      )}

      {/* Top Active Card */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl transition-transform ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          transform: exitDirection
            ? `translateX(${exitDirection === "like" ? 600 : -600}px) rotate(${
                exitDirection === "like" ? 25 : -25
              }deg)`
            : `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
          transition: isDragging ? "none" : "transform 0.25s ease-out",
        }}
      >
        {/* Photos & Overlay */}
        <div className="relative aspect-3/4 w-full overflow-hidden bg-muted">
          <img
            src={currentProfile.photos[activePhotoIdx]}
            alt={currentProfile.name}
            className="size-full object-cover pointer-events-none"
          />

          {/* Gradient Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

          {/* Top Photo Switch Indicators */}
          <div className="absolute top-3 inset-x-3 flex gap-1 z-10 pointer-events-none">
            {currentProfile.photos.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i === activePhotoIdx ? "bg-white shadow-xs" : "bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Photo Tap Zones */}
          <button
            type="button"
            onClick={prevPhoto}
            className="absolute inset-y-0 left-0 w-1/3 cursor-pointer z-10 focus:outline-none"
            aria-label="Previous photo"
          />
          <button
            type="button"
            onClick={nextPhoto}
            className="absolute inset-y-0 right-0 w-1/3 cursor-pointer z-10 focus:outline-none"
            aria-label="Next photo"
          />

          {/* Swipe Stamps */}
          <div
            className="absolute top-8 left-6 z-20 -rotate-12 rounded-xl border-4 border-emerald-500 bg-emerald-500/20 px-3 py-1 font-black text-emerald-400 text-lg uppercase tracking-wider backdrop-blur-xs pointer-events-none"
            style={{ opacity: likeOpacity }}
          >
            LIKE
          </div>

          <div
            className="absolute top-8 right-6 z-20 rotate-12 rounded-xl border-4 border-red-500 bg-red-500/20 px-3 py-1 font-black text-red-400 text-lg uppercase tracking-wider backdrop-blur-xs pointer-events-none"
            style={{ opacity: nopeOpacity }}
          >
            PASS
          </div>

          {/* Card Info Overlay */}
          <div className="absolute bottom-4 inset-x-4 text-white z-10 pointer-events-none space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black drop-shadow-md">
                {currentProfile.name}, {currentProfile.age}
              </h3>
              {currentProfile.verified && (
                <span className="flex size-4.5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="size-3 stroke-[3]" />
                </span>
              )}
            </div>

            <p className="text-xs text-white/90 drop-shadow flex items-center gap-1 font-medium">
              <GraduationCap className="size-3.5 shrink-0" />
              <span>
                {currentProfile.college} • {currentProfile.course}
              </span>
            </p>

            <p className="text-xs text-white/80 line-clamp-2 leading-relaxed drop-shadow pt-0.5">
              {currentProfile.bio}
            </p>

            {/* Interest Pills */}
            <div className="pt-2 flex flex-wrap gap-1.5">
              {currentProfile.interests.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Controls */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => completeSwipe("pass")}
          className="flex size-13 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/10 shadow-md active:scale-90 transition-all cursor-pointer"
          aria-label="Pass profile"
        >
          <X className="size-6 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => completeSwipe("like")}
          className="flex size-14 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 active:scale-90 transition-all cursor-pointer"
          aria-label="Like profile"
        >
          <Heart className="size-7 fill-white stroke-none" />
        </button>
      </div>
    </div>
  );
}

export default SwipeCardDeck;
