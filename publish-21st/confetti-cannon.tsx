"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

export interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  shape: "rect" | "circle";
  alpha: number;
}

export interface ConfettiCannonProps {
  buttonLabel?: string;
  particleCount?: number;
  colors?: string[];
  className?: string;
  onFire?: () => void;
}

const DEFAULT_COLORS = ["#22c55e", "#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];

export function ConfettiCannon({
  buttonLabel = "Celebrate Success",
  particleCount = 80,
  colors = DEFAULT_COLORS,
  className = "",
  onFire,
}: ConfettiCannonProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const particlesRef = React.useRef<ConfettiParticle[]>([]);
  const animFrameRef = React.useRef<number | null>(null);

  const fire = () => {
    onFire?.();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const originX = rect.width / 2;
    const originY = rect.height / 2;

    const newParticles: ConfettiParticle[] = Array.from({ length: particleCount }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4, // Upward initial impulse
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.4 ? "rect" : "circle",
        alpha: 1,
      };
    });

    particlesRef.current.push(...newParticles);

    if (!animFrameRef.current) {
      animate();
    }
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.02);

    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Gravity
      p.vx *= 0.98; // Friction
      p.rotation += p.vRot;
      p.alpha -= 0.012; // Fade out

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    if (particlesRef.current.length > 0) {
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      animFrameRef.current = null;
    }
  };

  React.useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Absolute Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute -inset-24 size-[calc(100%+12rem)] z-30"
      />

      {/* Trigger Button */}
      <button
        type="button"
        onClick={fire}
        className="relative z-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition-all cursor-pointer"
      >
        <Sparkles className="size-4 animate-spin-slow" />
        <span>{buttonLabel}</span>
      </button>
    </div>
  );
}

export default ConfettiCannon;
