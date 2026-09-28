"use client";

import { HelpCircle, Plus } from "lucide-react";
import { sounds } from "@/lib/sounds";

export function CleanFAQ() {
  const faqItems = [
    {
      question: "How do I get verified on my campus?",
      answer:
        "Sign up with your college email (.edu, .ac.in, or university domain). You instantly unlock full voting, confession, DM, and notes download access.",
    },
    {
      question: "Is anonymous posting really anonymous?",
      answer:
        "Yes. Anonymous posts and confessions have zero author identity attached to the public payload. Even campus moderators cannot trace the author.",
    },
    {
      question: "What if my college isn't listed yet?",
      answer:
        "Browse the Colleges Directory to request your campus hub. Over 1,350+ Indian colleges are already indexed, and new hubs are activated within 24 hours.",
    },
    {
      question: "Are academic notes and PYQs free?",
      answer:
        "Yes, completely free. Everything in the Academic Vault is uploaded and peer-reviewed by students for students.",
    },
    {
      question: "Can I explore without an account first?",
      answer:
        "Yes! You can explore in Viewer Mode to see campus trends, college hubs, and notes before creating an account.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 select-none relative">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border/50 text-muted-foreground text-xs font-bold">
            <HelpCircle className="size-3.5" />
            <span>Got Questions?</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Fast answers before you drop in.
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item) => (
            <details
              key={item.question}
              onToggle={() => sounds.tap()}
              className="group neo-card rounded-[24px] p-5 transition-all cursor-pointer open:ring-1 open:ring-primary/20"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xs sm:text-sm font-bold text-foreground [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span className="size-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground transition-transform duration-200 group-open:rotate-45 shrink-0">
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
