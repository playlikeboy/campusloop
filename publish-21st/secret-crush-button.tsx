"use client";

import * as React from "react";
import { Heart, Lock, Sparkles } from "lucide-react";

export interface SecretCrushButtonProps {
  initialCount?: number;
  label?: string;
  onCrushToggle?: (isCrush: boolean) => void;
  className?: string;
}

// Zero-asset Web Audio arpeggio chime for celebratory romance matches
function playMatchChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.07;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.28);
    });
  } catch {
    // Ignore audio context errors
  }
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export function SecretCrushButton({
  initialCount = 3,
  label = "Add to Secret Crush",
  onCrushToggle,
  className = "",
}: SecretCrushButtonProps) {
  const [isCrush, setIsCrush] = React.useState(false);
  const [count, setCount] = React.useState(initialCount);
  const [particles, setParticles] = React.useState<FloatingHeart[]>([]);

  const triggerParticles = () => {
    const newHearts: FloatingHeart[] = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 80,
      y: -20 - Math.random() * 50,
      size: 14 + Math.random() * 12,
      rotation: (Math.random() - 0.5) * 45,
    }));

    setParticles(newHearts);
    setTimeout(() => setParticles([]), 1000);
  };

  const handleClick = () => {
    const nextState = !isCrush;
    setIsCrush(nextState);
    setCount((prev) => (nextState ? prev + 1 : prev - 1));

    if (nextState) {
      playMatchChime();
      triggerParticles();
    }

    onCrushToggle?.(nextState);
  };

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Floating Particle Burst */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="pointer-events-none absolute text-pink-500 animate-out fade-out zoom-out"
          style={{
            transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`,
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <Heart style={{ width: p.size, height: p.size }} className="fill-pink-500 stroke-none" />
        </span>
      ))}

      {/* Main Interactive Button */}
      <button
        type="button"
        onClick={handleClick}
        className={`group relative flex items-center gap-2.5 rounded-full px-5 py-3 text-xs sm:text-sm font-black transition-all duration-300 active:scale-95 cursor-pointer ${
          isCrush
            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 scale-102"
            : "border border-border/80 bg-card hover:border-pink-500/50 hover:bg-pink-500/5 text-foreground shadow-xs"
        }`}
      >
        <span
          className={`flex size-6 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${
            isCrush ? "bg-white/20" : "bg-pink-500/10 text-pink-500"
          }`}
        >
          <Heart
            className={`size-3.5 transition-all duration-300 ${
              isCrush ? "fill-white stroke-white scale-110" : "stroke-pink-500"
            }`}
          />
        </span>

        <span>{isCrush ? "Secret Crush Added!" : label}</span>

        {/* Sealed Privacy Lock Chip */}
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            isCrush
              ? "bg-white/25 text-white"
              : "bg-muted text-muted-foreground group-hover:bg-pink-500/10 group-hover:text-pink-600"
          }`}
        >
          <Lock className="size-2.5" />
          <span>Sealed</span>
        </span>
      </button>

      {/* Helper text explaining cryptographic match */}
      <p className="mt-2.5 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Sparkles className="size-3 text-pink-500" />
        <span>Only revealed if you both crush on each other</span>
      </p>
    </div>
  );
}

export default SecretCrushButton;
