"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Compass, GraduationCap, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface MinimalLandingNavbarProps {
  isAuthenticated?: boolean;
}

export function MinimalLandingNavbar({ isAuthenticated = false }: MinimalLandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { label: "Features", href: "#features", icon: Compass },
    { label: "Academics", href: "/academics", icon: BookOpen },
    { label: "Colleges", href: "/colleges", icon: GraduationCap },
  ];

  return (
    <div className="sticky top-1.5 sm:top-3 z-50 px-2.5 sm:px-6 max-w-5xl mx-auto w-full select-none">
      <header className="flex h-12 sm:h-14 md:h-15 items-center justify-between px-2.5 sm:px-5 rounded-full border border-border/70 bg-background/90 dark:bg-background/85 backdrop-blur-xl shadow-xs transition-all">
        {/* Cute Voxel Brand Logo */}
        <Link
          href="/"
          onClick={() => {
            sounds.tap();
            haptics.light();
          }}
          className="flex items-center gap-2 group cursor-pointer shrink-0"
          aria-label="CampusLoop home — Cute Voxel Campus Network"
        >
          <div className="relative size-7 sm:size-8 md:size-9 shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:-rotate-3 drop-shadow-sm">
            <Image
              src="/campusloop/marketing/voxel/logo.webp"
              alt="CampusLoop logo"
              fill
              sizes="36px"
              priority
              className="object-contain"
            />
          </div>
          <div className="flex items-center">
            <span className="text-sm sm:text-base font-black tracking-tight text-foreground">
              Campus<span className="text-[#16a34a] font-black">Loop</span>
            </span>
            <span className="ml-1 size-1.5 rounded-full bg-[#22c55e] animate-pulse" />
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-background/90 transition-all cursor-pointer"
              >
                <Icon className="size-3.5 text-muted-foreground" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <ThemeToggle className="size-8 rounded-full border-none bg-muted/50 hover:bg-muted shrink-0" />

          <Link
            href={isAuthenticated ? "/feeds" : "/sign-up"}
            onClick={() => {
              sounds.tap();
              haptics.medium();
            }}
            className="inline-flex h-8 sm:h-8.5 md:h-9 shrink-0 items-center justify-center gap-1 sm:gap-1.5 rounded-full bg-[#22c55e] hover:bg-[#16a34a] px-3 sm:px-4 text-xs font-black text-white whitespace-nowrap active:scale-95 transition-all shadow-xs shadow-emerald-500/25 cursor-pointer"
          >
            {isAuthenticated ? (
              <>
                <span className="sm:hidden">App</span>
                <span className="hidden sm:inline">Open App</span>
              </>
            ) : (
              <>
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Join Campus</span>
              </>
            )}
            <ArrowUpRight className="size-3 sm:size-3.5 shrink-0" />
          </Link>

          {/* Mobile Menu Trigger with accessible 44px touch footprint */}
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              haptics.light();
              setMobileMenuOpen((open) => !open);
            }}
            className="relative flex size-8 sm:size-8.5 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground md:hidden transition-colors cursor-pointer touch-manipulation before:absolute before:-inset-1.5 before:content-['']"
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
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="mt-2 p-2.5 rounded-2xl border border-border/70 bg-background/95 backdrop-blur-2xl shadow-xl md:hidden space-y-2 select-none"
          >
            <div className="grid grid-cols-2 gap-1.5">
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
                    className="flex items-center gap-2 p-2.5 min-h-[44px] rounded-xl bg-muted/40 hover:bg-muted/70 text-xs font-bold text-foreground transition-all cursor-pointer"
                  >
                    <Icon className="size-3.5 text-[#16a34a] shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <Link
              href={isAuthenticated ? "/feeds" : "/sign-up"}
              onClick={() => {
                sounds.tap();
                haptics.medium();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center justify-center gap-1.5 min-h-[44px] py-2.5 rounded-xl bg-[#22c55e] text-white text-xs font-black shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <span>{isAuthenticated ? "Enter Campus" : "Join Your College"}</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
