"use client";

import { ArrowUpRight, BookOpen, Compass, Flame, Heart, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface MinimalLandingNavbarProps {
  isAuthenticated?: boolean;
}

export function MinimalLandingNavbar({ isAuthenticated = false }: MinimalLandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { label: "Campus Feed", href: "/feeds", icon: Flame },
    { label: "Colleges", href: "/colleges", icon: Compass },
    { label: "Academics", href: "/academics", icon: BookOpen },
    { label: "Campus Match", href: "/dating", icon: Heart },
  ];

  return (
    <div className="sticky top-2 sm:top-3 z-50 px-3 sm:px-6 max-w-6xl mx-auto w-full select-none">
      <header className="flex h-14 sm:h-16 items-center justify-between px-3.5 sm:px-5 rounded-full border border-border/60 bg-background/85 backdrop-blur-xl shadow-xs transition-all">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={() => {
            sounds.tap();
            haptics.light();
          }}
          className="flex items-center gap-2.5 group cursor-pointer"
          aria-label="CampusLoop home"
        >
          <div className="size-8.5 rounded-2xl bg-gradient-to-tr from-emerald-500 via-primary to-teal-400 flex items-center justify-center shadow-xs shadow-emerald-500/30 group-hover:scale-105 transition-transform">
            <span className="text-white text-xs font-black tracking-tight">CL</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm sm:text-base font-black tracking-tight text-foreground">
              Campus<span className="text-primary font-black">Loop</span>
            </span>
            <span className="ml-1.5 size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </Link>

        {/* Desktop Pill Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/30"
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all cursor-pointer"
              >
                <Icon className="size-3.5 text-muted-foreground" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle className="size-8.5 rounded-full border-none bg-muted/50 hover:bg-muted" />

          <Link
            href="/feeds"
            onClick={() => {
              sounds.tap();
              haptics.medium();
            }}
            className="inline-flex h-9 sm:h-9.5 items-center gap-1.5 rounded-full bg-primary px-4 sm:px-5 text-xs font-black text-white hover:opacity-90 active:scale-95 transition-all shadow-xs shadow-emerald-500/30 cursor-pointer"
          >
            <span>{isAuthenticated ? "Launch Campus" : "Join Free"}</span>
            <ArrowUpRight className="size-3.5" />
          </Link>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              haptics.light();
              setMobileMenuOpen((open) => !open);
            }}
            className="grid size-8.5 place-items-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground md:hidden transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="mt-2 p-3 rounded-3xl border border-border/70 bg-background/95 backdrop-blur-2xl shadow-xl md:hidden space-y-2 select-none"
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
                      haptics.light();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 text-xs font-bold text-foreground transition-all cursor-pointer"
                  >
                    <Icon className="size-4 text-primary" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <Link
              href="/feeds"
              onClick={() => {
                sounds.tap();
                haptics.medium();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white text-xs font-black shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <span>{isAuthenticated ? "Launch Campus" : "Join Your College"}</span>
              <ArrowUpRight className="size-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
