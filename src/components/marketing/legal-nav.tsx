"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, HelpCircle, Info, Mail, Shield, ShieldAlert } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const LEGAL_TABS = [
  { href: "/about", label: "About", icon: Info },
  { href: "/privacy", label: "Privacy", icon: Shield },
  { href: "/terms", label: "Terms", icon: FileText },
  { href: "/safety", label: "Safety", icon: ShieldAlert },
  { href: "/contact", label: "Contact", icon: Mail },
  { href: "/help", label: "Help", icon: HelpCircle },
];

/**
 * Cute Voxel Pill Tab Strip across informational & policy pages.
 * Features tactile audio feedback, active emerald status dot, and smooth horizontal scrolling.
 */
export function LegalNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-18 z-40 my-4 select-none px-3 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <nav
          aria-label="CampusLoop policy and information navigation"
          className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto p-1.5 rounded-full border border-border/70 bg-card/85 backdrop-blur-xl shadow-xs scrollbar-none"
        >
          {LEGAL_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                  isActive
                    ? "bg-[#22c55e] text-white shadow-xs shadow-emerald-500/30 font-black scale-102"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn("size-3.5", isActive ? "text-white" : "text-muted-foreground")} />
                <span>{tab.label}</span>
                {isActive && <span className="size-1 rounded-full bg-white animate-pulse" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
