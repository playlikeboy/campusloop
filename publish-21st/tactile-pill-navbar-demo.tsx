"use client";

import * as React from "react";
import { BookOpen, Compass, GraduationCap, Users } from "lucide-react";
import { TactilePillNavbar } from "./tactile-pill-navbar";

export default function TactilePillNavbarDemo() {
  return (
    <div className="relative min-h-[500px] w-full bg-gradient-to-b from-background via-muted/30 to-background p-4 sm:p-8">
      <TactilePillNavbar
        brandName="Campus"
        brandHighlight="Loop"
        links={[
          { label: "Radar", href: "#radar", icon: Compass },
          { label: "Academics", href: "#academics", icon: BookOpen },
          { label: "Colleges", href: "#colleges", icon: GraduationCap },
          { label: "Community", href: "#community", icon: Users },
        ]}
        actionLabel="Join Campus"
        onAction={() => alert("Action clicked with sound!")}
      />

      <div className="mx-auto mt-20 max-w-xl text-center space-y-4">
        <span className="inline-block rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          Tactile Audio Feedback Included
        </span>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
          Floating Glassmorphic Island
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Interactive rounded-full navigation island with active pill indicator, dark mode toggle, synthesized zero-asset Web Audio micro-clicks, and responsive mobile drawer.
        </p>
      </div>
    </div>
  );
}
