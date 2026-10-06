"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface FAQItem {
  question: string;
  answer: string;
}

export function VoxelFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: "Is my identity actually anonymous when I post confessions?",
      answer:
        "Yes, 100%. When you submit an anonymous confession, question, or poll vote, your personal identity is cryptographically decoupled before the database write occurs. Even system administrators cannot trace anonymous posts back to your profile.",
    },
    {
      question: "Does my college administration or faculty monitor this?",
      answer:
        "No. CampusLoop is 100% independent and student-run. College administrations and professors do not have moderator privileges or backdoors into student conversations. It is a genuine, safe sanctuary for student life.",
    },
    {
      question: "What if I don't have a .ac.in or institutional email address?",
      answer:
        "You can verify your student status in under 60 seconds by uploading a photo of your physical student ID card or semester registration receipt. Once verified, you unlock the full campus hub.",
    },
    {
      question: "Is CampusLoop really free or are there hidden paywalls?",
      answer:
        "CampusLoop is 100% free for college students. All verified campus feeds, 45,000+ lecture notes and PYQs downloads, student club hubs, and Campus Match crush deck are free with zero paywalls.",
    },
    {
      question: "Can I connect with students from other universities across India?",
      answer:
        "Yes! The Campus Radius switcher lets you toggle between your local college hub (e.g., BIT Mesra, IIT Bombay, DU, BITS) and the All-India national feed to discover inter-college hackathons, fests, and discussions across 1,350+ institutions.",
    },
  ];

  const toggle = (idx: number) => {
    sounds.tap();
    haptics.light();
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="relative py-20 sm:py-28 bg-background overflow-hidden select-none border-t border-border/40">
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-black text-[#16a34a] dark:text-emerald-400 mb-3 border border-emerald-500/20 shadow-xs">
            <HelpCircle className="size-3.5 text-[#22c55e]" />
            <span>Got Questions? We Have Answers</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.08]">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
            Everything you need to know about student privacy, verification, and joining the loop.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className={`rounded-2xl border transition-all ${
                  isOpen
                    ? "border-[#22c55e]/50 bg-card shadow-md"
                    : "border-border/60 bg-card/60 hover:border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-black text-foreground cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#22c55e]" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-5 sm:px-5 text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
