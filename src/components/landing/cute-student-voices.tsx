"use client";

import { GraduationCap, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CuteStudentVoices() {
  const reviews = [
    {
      name: "Aarav Sharma",
      handle: "@aarav_cse",
      college: "BIT Mesra",
      branch: "CSE · 2nd Year",
      badgeVariant: "catBlue" as const,
      comment:
        "The Academic Vault literally saved my endsem CGPA on Operating Systems. Downloaded the handwritten solved PYQ papers at 3 AM the night before the exam. 100% free with zero paywalls.",
    },
    {
      name: "Ananya Iyer",
      handle: "@ananya_bio",
      college: "IIT Bombay",
      branch: "Biotech · 3rd Year",
      badgeVariant: "catPink" as const,
      comment:
        "Finally a campus network where we can talk about actual mess food, hostel maintenance, and professors without worrying about admins or recruiters watching. The anonymity decoupling gives real peace of mind.",
    },
    {
      name: "Rohan Varma",
      handle: "@rohan_du",
      college: "Delhi University",
      branch: "Economics · 2nd Year",
      badgeVariant: "coral" as const,
      comment:
        "The Secret Crush Radar is pure genius. Neither of us would have made a move in real life, but we both added each other to our private vault. Best mutual match feature ever built.",
    },
    {
      name: "Sneha Reddy",
      handle: "@sneha_nit",
      college: "NIT Trichy",
      branch: "ECE · Final Year",
      badgeVariant: "catYellow" as const,
      comment:
        "Found our fourth hackathon teammate and our final year project mentor through the campus hub in less than 2 hours. The college directory connects verified students instantly.",
    },
  ];

  return (
    <section className="relative py-12 sm:py-20 bg-muted/15 select-none border-t border-border/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-3">
            <ShieldCheck className="size-3.5" />
            <span>Real Student Stories</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-[1.12]">
            Loved by students across India.
          </h2>

          <p className="mt-2.5 text-sm sm:text-base text-muted-foreground font-medium">
            Hear from verified peers navigating hostel life, exams, and campus connections.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {reviews.map((r) => (
            <div
              key={r.handle}
              className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant={r.badgeVariant} className="text-[10px] py-0.5 px-2">
                    {r.college}
                  </Badge>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                    <GraduationCap className="size-3 text-primary" />
                    <span>Student Voice</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                  &ldquo;{r.comment}&rdquo;
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border/50">
                <p className="text-xs font-bold text-foreground">{r.name}</p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {r.branch}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Responsible Transparency Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-muted-foreground font-medium">
            Illustrative student feedback compiled from student pilot users and community discussions across Indian university hubs.
          </p>
        </div>
      </div>
    </section>
  );
}
