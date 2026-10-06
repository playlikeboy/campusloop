"use client";

import * as React from "react";
import { InteractivePollCard } from "./interactive-poll-card";

export default function InteractivePollCardDemo() {
  return (
    <div className="flex min-h-[480px] w-full items-center justify-center bg-background p-6">
      <InteractivePollCard
        question="When is your peak coding flow?"
        subtitle="Campus Hackathon 2026 Poll"
        options={[
          { id: "1", label: "Late Night (12 AM - 4 AM)", votes: 142 },
          { id: "2", label: "Early Morning (5 AM - 9 AM)", votes: 48 },
          { id: "3", label: "Afternoon Coffee Sprint", votes: 89 },
          { id: "4", label: "Anytime with Lo-Fi Beats", votes: 215 },
        ]}
      />
    </div>
  );
}
