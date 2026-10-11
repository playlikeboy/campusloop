"use client";

import { useState } from "react";
import {
  Clock,
  Moon,
  Sun,
  Users,
  Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CuteSparkle } from "@/components/ui/cute-illustrations";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export function CuteDailyRush() {
  const [activeStep, setActiveStep] = useState(0);

  const timeline = [
    {
      time: "8:30 AM",
      phase: "Morning Rush",
      icon: Sun,
      badgeVariant: "catYellow" as const,
      title: "Handwritten Lab Formula Sheets Dropped",
      description:
        "30 minutes before the 9:00 AM tutorial, a senior uploads the solved lab calculation sheet to the Academic Vault. 420 students download it in 15 minutes.",
      tag: "Academic Vault",
      campusNote: "Hostel 3 · Chemistry & Physics Labs",
    },
    {
      time: "1:45 PM",
      phase: "Canteen Hour",
      icon: Utensils,
      badgeVariant: "catBlue" as const,
      title: "Mess vs Maggi Point Emergency Poll",
      description:
        "Someone creates a live poll: 'Is today's mess rajma edible or are we marching to the back gate roll stall?' 84% voted back gate.",
      tag: "Live Campus Poll",
      campusNote: "Central Canteen · 312 student votes",
    },
    {
      time: "6:15 PM",
      phase: "Club Hour",
      icon: Users,
      badgeVariant: "coral" as const,
      title: "Hackathon Team Search & Fest Auditions",
      description:
        "ACM and dramatics societies drop official announcement flyers for the annual inter-college fest. Juniors find senior mentors for their first hackathon.",
      tag: "Club Announcements",
      campusNote: "R&D Block & Auditorium",
    },
    {
      time: "11:30 PM",
      phase: "Midnight Chai",
      icon: Moon,
      badgeVariant: "catPink" as const,
      title: "Midnight Whispers & Secret Crushes",
      description:
        "The timeline turns into unfiltered storytelling. Late-night hostel guitar sessions, confessions about exams, and secret crush radar notifications.",
      tag: "Anonymous Confessions",
      campusNote: "Hostel Terraces & Tapri",
    },
  ];

  return (
    <section className="relative py-12 sm:py-20 bg-muted/20 select-none border-y border-border/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-3">
            <Clock className="size-3.5" />
            <span>24 Hours in College Life</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-[1.12]">
            A day in the life on CampusLoop.
          </h2>

          <p className="mt-2.5 text-sm sm:text-base text-muted-foreground font-medium">
            From morning tutorial panic to midnight hostel terrace confessions.
          </p>
        </div>

        {/* Step Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-8">
          {timeline.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={item.time}
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setActiveStep(idx);
                }}
                className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-primary bg-card text-foreground shadow-2xs ring-1 ring-primary/20"
                    : "border-border/60 bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold font-mono text-primary">{item.time}</span>
                  <Icon className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <span className="text-xs font-extrabold tracking-tight truncate">{item.phase}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Showcase Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                {(() => {
                  const CurrentIcon = timeline[activeStep].icon;
                  return <CurrentIcon className="size-5" />;
                })()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-lg text-foreground">
                    {timeline[activeStep].title}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {timeline[activeStep].campusNote}
                </span>
              </div>
            </div>

            <Badge variant={timeline[activeStep].badgeVariant} className="text-xs py-1 px-3">
              {timeline[activeStep].tag}
            </Badge>
          </div>

          <p className="mt-5 text-sm sm:text-base text-foreground/90 leading-relaxed font-medium max-w-3xl">
            {timeline[activeStep].description}
          </p>

          <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <div className="flex items-center gap-2">
              <CuteSparkle size={14} className="text-primary" />
              <span>Happening every day across 1,350+ indexed Indian colleges</span>
            </div>
            <span className="font-mono text-primary font-bold">{timeline[activeStep].time}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
