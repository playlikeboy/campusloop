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

export function CuteLandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: "Is my identity actually anonymous when I post confessions?",
      answer:
        "Yes, 100%. When you submit an anonymous confession or question, your identity is cryptographically decoupled before the database write occurs. Even system administrators cannot trace anonymous posts back to your user account.",
    },
    {
      question: "Do professors, deans, or college administration monitor this?",
      answer:
        "No. CampusLoop is 100% independent and student-run. College administrations and faculty do not have administrative privileges or backdoors into student conversations. It is a genuine, safe sanctuary for student life.",
    },
    {
      question: "What if I don't have a .ac.in or institutional email address?",
      answer:
        "You can verify your student status in under 60 seconds by uploading a photo of your physical student ID card or semester registration slip. Once verified, you unlock the full campus hub.",
    },
    {
      question: "Is CampusLoop really free or are there hidden paywalls?",
      answer:
        "CampusLoop is 100% free for college students. All verified campus feeds, 45,000+ lecture notes and solved PYQs downloads, student club hubs, and Campus Match crush deck are free with zero paywalls.",
    },
    {
      question: "How does the Secret Crush Radar work without awkwardness?",
      answer:
        "You add classmates to your private Zero Knowledge Vault. Neither person is ever notified or alerted unless both students independently add each other to their vaults. If it's mutual, a private chat unlocks instantly!",
    },
    {
      question: "Can I connect with students from other colleges across India?",
      answer:
        "Yes! The Campus Radius switcher lets you toggle between your local college hub and the All-India national feed to discover inter-college hackathons, fests, and discussions across 1,350+ institutions.",
    },
  ];

  const toggle = (idx: number) => {
    sounds.tap();
    haptics.light();
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="relative py-12 sm:py-20 md:py-24 bg-background select-none border-t border-border/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-3">
            <HelpCircle className="size-3.5 text-primary" />
            <span>Got Questions? We Have Answers</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-[1.12]">
            Frequently Asked Questions
          </h2>

          <p className="mt-2.5 text-sm sm:text-base text-muted-foreground font-medium">
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
                    ? "border-primary/50 bg-card shadow-2xs"
                    : "border-border/70 bg-card hover:border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 min-h-[48px] text-left text-xs sm:text-sm font-bold text-foreground cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading font-bold text-sm sm:text-base pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                        {faq.answer}
                      </div>
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
