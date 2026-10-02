"use client";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  GraduationCap,
  MessageSquare,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

interface LoopNode {
  step: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

const LOOP_NODES: LoopNode[] = [
  {
    step: "01",
    title: "Verified Student",
    subtitle: "Authenticated college email",
    icon: ShieldCheck,
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    step: "02",
    title: "Campus Pulse",
    subtitle: "Real-time feeds & questions",
    icon: MessageSquare,
    tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    step: "03",
    title: "Communities & Clubs",
    subtitle: "ACM, Robotics, Dramatics",
    icon: Users,
    tone: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  {
    step: "04",
    title: "Academic Vault",
    subtitle: "Branch notes & solved PYQs",
    icon: GraduationCap,
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    step: "05",
    title: "Live Events",
    subtitle: "Hackathons & demo nights",
    icon: CalendarDays,
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  {
    step: "06",
    title: "Campus Utilities",
    subtitle: "Marketplace, housing, pooling",
    icon: ShoppingBag,
    tone: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
];

export function CampusLoopGraph() {
  return (
    <section className="border-t border-border/50 py-20 sm:py-28 px-4 sm:px-6 relative select-none">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-2xs">
            <Repeat className="size-3.5" />
            <span>The Connected Campus Loop</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
            How your college life connects.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
            Every question, note, club, and event feeds back into the student network. One verified loop for
            your entire campus journey.
          </p>
        </div>

        {/* Visual Connected Stepper Flow */}
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 relative z-10">
            {LOOP_NODES.map((node, index) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.step}
                  className="flex flex-col justify-between p-4 sm:p-5 rounded-3xl border border-border/60 bg-card shadow-2xs relative group hover:border-border transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-muted-foreground tabular-nums">
                        {node.step}
                      </span>
                      <span className={`grid size-9 place-items-center rounded-xl border ${node.tone}`}>
                        <Icon className="size-4" />
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-foreground">{node.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{node.subtitle}</p>
                    </div>
                  </div>

                  {index < LOOP_NODES.length - 1 && (
                    <div className="hidden lg:flex items-center justify-center -right-4 top-1/2 -translate-y-1/2 absolute z-20 pointer-events-none">
                      <span className="grid size-6 place-items-center rounded-full bg-background border border-border/70 text-muted-foreground text-[10px] shadow-2xs">
                        <ArrowRight className="size-3" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Loop Closure Strip */}
          <div className="mt-6 p-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <p className="text-xs font-semibold text-foreground">
                Everything ties back to your verified college identity. Zero disconnected silos.
              </p>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Single Campus Border
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
