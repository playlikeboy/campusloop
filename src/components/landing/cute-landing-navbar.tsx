"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Compass, GraduationCap, Heart, Menu, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { CuteCatMascot, CuteSparkle } from "@/components/ui/cute-illustrations";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface CuteLandingNavbarProps {
  isAuthenticated?: boolean;
}

export function CuteLandingNavbar({ isAuthenticated = false }: CuteLandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { label: "Features", href: "#features", icon: Compass },
    { label: "Academic Vault", href: "/academics", icon: BookOpen },
    { label: "1,350+ Colleges", href: "/colleges", icon: GraduationCap },
    { label: "Campus Match", href: "/dating", icon: Heart },
  ];

  return (
    <header className="sticky top-2 sm:top-3.5 z-50 px-3 sm:px-6 max-w-5xl mx-auto w-full select-none">
      <div className="flex h-13 sm:h-14 items-center justify-between px-3 sm:px-5 rounded-full border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xs transition-all">
        {/* Cute Mascot Brand Logo */}
        <Link
          href="/"
          onClick={() => {
            sounds.tap();
            haptics.light();
          }}
          className="flex items-center gap-2.5 group cursor-pointer shrink-0"
          aria-label="CampusLoop home — Cute Verified Campus Network"
        >
          <div className="relative size-8 sm:size-9 flex items-center justify-center rounded-2xl bg-canvas/40 border border-border/60 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3 shadow-2xs">
            <CuteCatMascot size={32} />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="font-heading text-base sm:text-lg font-bold tracking-tight text-foreground leading-none">
                Campus<span className="text-primary font-bold">Loop</span>
              </span>
              <CuteSparkle size={12} className="text-primary" />
            </div>
            <span className="text-[9px] text-muted-foreground font-semibold tracking-wide uppercase leading-tight hidden sm:inline">
              Verified Student Loop
            </span>
          </div>
        </Link>

        {/* Desktop Nav Chips */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/60"
        >
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-card transition-all cursor-pointer"
              >
                <Icon className="size-3.5 text-muted-foreground" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle className="size-8.5 rounded-full border border-border/60 bg-muted/40 hover:bg-muted shrink-0" />

          <Link
            href={isAuthenticated ? "/feeds" : "/sign-up"}
            onClick={() => {
              sounds.tap();
              haptics.medium();
            }}
          >
            <Button size="sm" className="hidden sm:inline-flex h-9 px-4 text-xs font-bold gap-1.5 shadow-2xs">
              <Zap className="size-3.5" />
              <span>{isAuthenticated ? "Enter Campus" : "Join Free"}</span>
            </Button>
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              haptics.light();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden flex size-8.5 items-center justify-center rounded-full border border-border/70 bg-muted/40 text-foreground hover:bg-muted cursor-pointer active:scale-95 transition-all"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Animated Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="md:hidden mt-2 rounded-3xl border border-border/80 bg-card/98 backdrop-blur-2xl p-4 shadow-lg space-y-2 select-none"
          >
            <div className="grid grid-cols-2 gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      sounds.tap();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-2xl bg-muted/30 hover:bg-muted/70 text-xs font-bold text-foreground border border-border/50 transition-colors"
                  >
                    <Icon className="size-4 text-primary" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border/50">
              <Link
                href={isAuthenticated ? "/feeds" : "/sign-up"}
                onClick={() => {
                  sounds.pop();
                  setMobileMenuOpen(false);
                }}
                className="w-full"
              >
                <Button className="w-full h-10 text-xs font-bold gap-2">
                  <Zap className="size-4" />
                  <span>{isAuthenticated ? "Enter Campus Loop" : "Join with College Email"}</span>
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
