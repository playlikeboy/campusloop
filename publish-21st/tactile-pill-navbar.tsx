"use client";

import * as React from "react";
import { ArrowUpRight, Compass, Menu, Moon, Sun, X } from "lucide-react";

export interface NavLinkItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TactilePillNavbarProps {
  brandName?: string;
  brandHighlight?: string;
  links?: NavLinkItem[];
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

// Lightweight zero-asset Web Audio synthesizer for crisp micro-clicks
function playPillSound(type: "tap" | "pop" = "tap") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "tap") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    // Ignore audio context errors
  }
}

export function TactilePillNavbar({
  brandName = "Campus",
  brandHighlight = "Loop",
  links = [
    { label: "Radar", href: "#radar", icon: Compass },
    { label: "Features", href: "#features" },
    { label: "Community", href: "#community" },
  ],
  actionLabel = "Get Started",
  onAction,
  className = "",
}: TactilePillNavbarProps) {
  const [activeTab, setActiveTab] = React.useState<string>(links[0]?.label ?? "");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);

  const toggleTheme = () => {
    playPillSound("tap");
    setIsDark((prev) => !prev);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark");
    }
  };

  return (
    <div className={`sticky top-3 sm:top-4 z-50 px-3 sm:px-6 max-w-5xl mx-auto w-full select-none ${className}`}>
      <header className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 rounded-full border border-border/60 bg-background/85 backdrop-blur-xl shadow-xs transition-all">
        {/* Brand Logo */}
        <a
          href="#"
          onClick={() => playPillSound("tap")}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <span className="font-black text-sm">CL</span>
          </div>
          <div className="flex items-center">
            <span className="text-base sm:text-lg font-black tracking-tight text-foreground">
              {brandName}
              <span className="text-primary font-black">{brandHighlight}</span>
            </span>
            <span className="ml-1.5 size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Navbar Links"
          className="hidden md:flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/40"
        >
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.label;

            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  playPillSound("tap");
                  setActiveTab(link.label);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-background text-foreground shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                {Icon && <Icon className="size-3.5" />}
                <span>{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex size-9 items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              playPillSound("pop");
              onAction?.();
            }}
            className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full bg-primary hover:bg-primary/90 px-4 sm:px-5 text-xs font-black text-primary-foreground active:scale-95 transition-all shadow-xs shadow-primary/25 cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ArrowUpRight className="size-3.5" />
          </button>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => {
              playPillSound("tap");
              setMobileMenuOpen((open) => !open);
            }}
            className="grid size-9 place-items-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground md:hidden transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mt-2 p-3 rounded-3xl border border-border/70 bg-background/95 backdrop-blur-2xl shadow-xl md:hidden space-y-2 select-none">
          <div className="grid grid-cols-2 gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => {
                    playPillSound("tap");
                    setActiveTab(link.label);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 text-xs font-bold text-foreground transition-all cursor-pointer"
                >
                  {Icon && <Icon className="size-3.5 text-primary" />}
                  <span>{link.label}</span>
                </a>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              playPillSound("pop");
              setMobileMenuOpen(false);
              onAction?.();
            }}
            className="flex w-full items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-black shadow-md shadow-primary/25 active:scale-95 transition-all cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ArrowUpRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default TactilePillNavbar;
