"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
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
      question: "Is CampusLoop completely free for college students?",
      answer:
        "Yes! CampusLoop is 100% free for all university students. All core features — including the verified campus feed, lecture notes vault, past year questions (PYQs), club directories, and campus match — are available at zero cost with no paywalls.",
    },
    {
      question: "How does college verification work?",
      answer:
        "You can verify your student status instantly using your official college email (e.g., .ac.in, .edu.in) or by uploading your student ID card. Once verified, you get a green verified student badge and full access to your college's private hubs.",
    },
    {
      question: "Can I switch between my college feed and other universities?",
      answer:
        "Yes! The Campus Radius switcher allows you to toggle seamlessly between your local campus timeline (BIT Mesra, IIT Bombay, etc.) and the national All-India timeline to see trending hackathons, fests, and discussions across 1,350+ institutions.",
    },
    {
      question: "How are anonymous confessions moderated?",
      answer:
        "Our Agatha trust engine and automated moderation system continuously screen for targeted harassment, doxxing, phone numbers, and abuse while preserving complete student pseudonymity in anonymous confession spaces.",
    },
    {
      question: "Can student clubs and societies broadcast announcements?",
      answer:
        "Yes. Recognized campus societies, cultural clubs, coding chapters (GDSC, ACM, IEEE), and fest teams can register dedicated society hubs to post official announcements, recruit members, and coordinate events.",
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
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-black text-[#16a34a] dark:text-emerald-400 mb-3 shadow-xs">
            <HelpCircle className="size-3.5" />
            <span>Got Questions?</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Everything you need to know about joining and exploring CampusLoop.
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
