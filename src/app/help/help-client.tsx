"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, Mail, Search, ShieldCheck } from "lucide-react";
import { CleanFooter } from "@/components/landing/clean-footer";
import { MinimalLandingNavbar } from "@/components/landing/minimal-landing-navbar";

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    category: "Verification & Access",
    question: "How do I get verified on my campus?",
    answer:
      "Sign up using your college-issued email domain (.ac.in, .edu, or recognized institutional domain). You will receive a verification link to confirm your enrollment and unlock your campus feed.",
  },
  {
    category: "Verification & Access",
    question: "What if my college isn't listed in the directory?",
    answer:
      "Visit our Colleges directory to submit an institution request. Provide your college name and official domain. Our campus team verifies and onboards new domains within 24–48 hours.",
  },
  {
    category: "Academics",
    question: "How does the Academic Vault work?",
    answer:
      "The Academic Vault contains lecture notes, module summaries, lab manuals, and previous year question papers (PYQs) organized by branch and semester. All materials are completely free to read and download.",
  },
  {
    category: "Academics",
    question: "Can I contribute notes or question papers?",
    answer:
      "Yes! Any verified student can upload study material to their college branch vault. Uploads are peer-reviewed and earn Loop Points (LP) to highlight top student contributors.",
  },
  {
    category: "Safety & Anonymity",
    question: "Is anonymous posting really anonymous?",
    answer:
      "Yes, your username, avatar, and profile are never displayed on anonymous posts or confessions. To prevent cyberbullying and ragging, cryptographic escrow holds an internal audit token that can only be flagged by safety moderators in cases of severe statutory harm.",
  },
  {
    category: "Safety & Anonymity",
    question: "How do I report inappropriate content or ragging?",
    answer:
      "Every post and comment features a three-dot menu with a direct 'Report' button. Reports trigger immediate moderator review. For urgent safety concerns, you can also write directly to safety@campusloop.space.",
  },
  {
    category: "Communities & Events",
    question: "How do clubs and student communities get formed?",
    answer:
      "Verified students can launch interest hubs, technical chapters (e.g. ACM, IEEE), or cultural clubs. Sub-hubs let campus societies publish official announcements, event registrations, and discussion threads.",
  },
];

export function HelpClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQS;
    const query = searchQuery.toLowerCase();
    return FAQS.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MinimalLandingNavbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <HelpCircle className="size-3.5" />
              <span>CampusLoop Help Center</span>
            </span>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Everything you need to know about getting verified, finding notes, and participating safely.
            </p>

            {/* Search Input */}
            <div className="mt-8 max-w-lg mx-auto relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. verification, notes, safety)..."
                className="w-full rounded-2xl border border-border/70 bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="mt-12 space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-border/50 bg-card p-6">
                <p className="text-sm font-semibold text-foreground">No matching questions found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a different search term or write to our support desk.
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xs transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-muted/30"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {faq.category}
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-foreground mt-0.5">
                          {faq.question}
                        </h2>
                      </div>
                      <ChevronDown
                        className={`size-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 mt-1">
                        <p className="pt-3">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Support Banner */}
          <div className="mt-14 rounded-3xl border border-border/60 bg-muted/30 p-6 sm:p-8 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                Still have questions?
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Our campus support desk is here to help with email verification or institutional requests.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 shrink-0">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary/95 transition-colors"
              >
                <Mail className="size-3.5" />
                <span>Contact Desk</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <CleanFooter />
    </div>
  );
}
