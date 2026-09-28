"use client";

import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface MobileStickyBarProps {
  isAuthenticated?: boolean;
}

export function MobileStickyBar({ isAuthenticated = false }: MobileStickyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      // Show only after scrolling down a bit past the hero header
      if (window.scrollY > 180) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 z-50 md:hidden select-none animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="p-1.5 rounded-full border border-border/70 bg-background/90 backdrop-blur-2xl shadow-xl flex items-center justify-between gap-2">
        <Link
          href="/colleges"
          onClick={() => {
            sounds.tap();
            haptics.light();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 h-10 px-3 rounded-full bg-muted/60 hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer truncate"
        >
          <Compass className="size-3.5 text-primary shrink-0" />
          <span className="truncate">Explore Hubs</span>
        </Link>

        <Link
          href="/feeds"
          onClick={() => {
            sounds.tap();
            haptics.medium();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 h-10 px-4 rounded-full bg-primary text-white text-xs font-black shadow-md shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer truncate"
        >
          <span className="truncate">{isAuthenticated ? "Open App" : "Join Free"}</span>
          <ArrowRight className="size-3.5 shrink-0" />
        </Link>
      </div>
    </div>
  );
}
