"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  GraduationCap,
  HelpCircle,
  Mail,
  Search,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { CleanFooter } from "@/components/landing/clean-footer";
import { MinimalLandingNavbar } from "@/components/landing/minimal-landing-navbar";
import { LegalNav } from "@/components/marketing/legal-nav";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const CATEGORIES = [
  "All Questions",
  "Verification & Access",
  "Academics & Vault",
  "Safety & Anonymity",
  "Communities & Clubs",
];

const FAQS: FAQItem[] = [
  {
    id: "verify-1",
    category: "Verification & Access",
    question: "How do I get verified on my campus hub?",
    answer:
      "Sign up using your college-issued institutional email (.ac.in, .edu, or recognized campus domain). You will receive an instant verification link that confirms your active enrollment and unlocks your campus timeline.",
  },
  {
    id: "verify-2",
    category: "Verification & Access",
    question: "What if my college domain is not listed yet?",
    answer:
      "Go to our College Directory and submit an institution request. Provide your college name and official domain. Our campus team verifies and onboards new university domains within 24 hours.",
  },
  {
    id: "academics-1",
    category: "Academics & Vault",
    question: "How does the Academic Vault work?",
    answer:
      "The Academic Vault contains lecture notes, module summaries, lab manuals, and 5-year solved previous year question papers (PYQs) organized by branch, subject code, and semester. All materials are 100% free to read and download.",
  },
  {
    id: "academics-2",
    category: "Academics & Vault",
    question: "Can I upload notes or past papers?",
    answer:
      "Yes! Verified students can upload study materials to their college or branch vault. Quality uploads are peer-reviewed and reward you with Loop Points (LP) to unlock verified creator badges.",
  },
  {
    id: "safety-1",
    category: "Safety & Anonymity",
    question: "Is anonymous posting really private from classmates?",
    answer:
      "Yes, your username, avatar, and profile ID are completely decoupled from anonymous posts and confessions. To deter cyber-ragging and unlawful threats, cryptographic escrow holds an internal audit token that can only be flagged by safety moderators in severe statutory incidents.",
  },
  {
    id: "safety-2",
    category: "Safety & Anonymity",
    question: "How do I report harassment or anti-ragging violations?",
    answer:
      "Every post, comment, and confession features a direct 'Report' button in its options menu. Accumulating 3 independent reports automatically quarantines the content from the campus feed pending moderator review. For urgent concerns, contact safety@campusloop.space directly.",
  },
  {
    id: "communities-1",
    category: "Communities & Clubs",
    question: "How do student clubs and societies create hubs?",
    answer:
      "Verified students can launch interest hubs, technical chapters (such as ACM, IEEE, GDG), or cultural fests. Sub-hubs allow campus societies to publish official announcements, event registrations, and discussion threads.",
  },
  {
    id: "communities-2",
    category: "Communities & Clubs",
    question: "Can I explore posts from other colleges in India?",
    answer:
      "Yes! You can toggle between your local campus timeline and the national radar (/discover) to explore trending memes, fests, hackathons, and placement roadmaps across 1,350+ universities in India.",
  },
];

export function HelpClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Questions");
  const [openId, setOpenId] = useState<string | null>("verify-1");
  const [feedback, setFeedback] = useState<Record<string, "yes" | "no">>({});

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory =
        selectedCategory === "All Questions" || faq.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, selectedCategory]);

  const toggleAccordion = (id: string) => {
    sounds.tap();
    haptics.light();
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleFeedback = (id: string, type: "yes" | "no") => {
    sounds.pop();
    haptics.medium();
    setFeedback((prev) => ({ ...prev, [id]: type }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground select-none">
      <MinimalLandingNavbar />
      <LegalNav />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary shadow-2xs">
              <HelpCircle className="size-3.5 text-[#16a34a]" />
              <span>CampusLoop Help Center • Instant Answers</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Everything you need to know about college email verification, the Academic Vault, anonymous
              confessions, and student safety.
            </p>

            {/* Voxel Search Bar */}
            <div className="pt-4 max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by keyword (e.g. notes, verification, anon)..."
                className="w-full rounded-2xl border border-border/70 bg-card py-3.5 pl-11 pr-10 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                      setSelectedCategory(cat);
                    }}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                      isActive
                        ? "bg-[#22c55e] text-white shadow-xs shadow-emerald-500/25 font-black scale-102"
                        : "border border-border/70 bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 rounded-3xl border border-border/70 bg-card p-6 shadow-2xs space-y-2">
                <p className="text-sm font-bold text-foreground">No matching questions found</p>
                <p className="text-xs text-muted-foreground">
                  Try searching for different terms or write directly to our student support desk.
                </p>
                <div className="pt-2">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs"
                  >
                    <Mail className="size-3.5" />
                    <span>Contact Support Desk</span>
                  </Link>
                </div>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openId === faq.id;
                const userFeedback = feedback[faq.id];

                return (
                  <div
                    key={faq.id}
                    className={cn(
                      "overflow-hidden rounded-3xl border transition-all duration-200 shadow-2xs",
                      isOpen
                        ? "border-[#16a34a]/40 bg-card shadow-md shadow-emerald-500/5"
                        : "border-border/70 bg-card/85 hover:border-border"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleAccordion(faq.id)}
                      className="flex w-full items-center justify-between p-5 text-left transition-colors cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <div className="space-y-1 pr-4">
                        <span className="inline-block text-[10px] font-black uppercase tracking-wider text-[#16a34a]">
                          {faq.category}
                        </span>
                        <h2 className="text-sm sm:text-base font-extrabold text-foreground">
                          {faq.question}
                        </h2>
                      </div>
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-transform duration-200",
                          isOpen ? "rotate-180 bg-primary/10 text-primary" : ""
                        )}
                      >
                        <ChevronDown className="size-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-border/40 px-5 pt-4 pb-5 space-y-4">
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>

                        {/* Interactive Feedback */}
                        <div className="pt-2 flex items-center justify-between border-t border-border/30 text-[11px] text-muted-foreground">
                          <span>Was this helpful?</span>
                          {userFeedback ? (
                            <span className="flex items-center gap-1 text-[#16a34a] font-bold">
                              <Check className="size-3.5" />
                              <span>Thank you for your feedback!</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleFeedback(faq.id, "yes")}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
                              >
                                <ThumbsUp className="size-3 text-emerald-500" />
                                <span>Yes</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFeedback(faq.id, "no")}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
                              >
                                <ThumbsDown className="size-3 text-red-500" />
                                <span>No</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Three Voxel Quick Action Tiles */}
          <div className="grid gap-4 sm:grid-cols-3 pt-6">
            <Link
              href="/colleges"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="group rounded-3xl border border-border/70 bg-card/85 p-5 shadow-2xs hover:border-primary/50 hover:-translate-y-1 transition-all"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="size-4.5" />
              </div>
              <h3 className="mt-3.5 text-sm font-extrabold text-foreground">Missing Your College?</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Submit your institutional domain to be whitelisted within 24 hours.
              </p>
            </Link>

            <Link
              href="/safety"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="group rounded-3xl border border-border/70 bg-card/85 p-5 shadow-2xs hover:border-red-500/50 hover:-translate-y-1 transition-all"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <ShieldAlert className="size-4.5" />
              </div>
              <h3 className="mt-3.5 text-sm font-extrabold text-foreground">Urgent Safety Concern?</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Anti-ragging helplines, doxxing shields, and emergency 24/7 contacts.
              </p>
            </Link>

            <Link
              href="/contact"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="group rounded-3xl border border-border/70 bg-card/85 p-5 shadow-2xs hover:border-blue-500/50 hover:-translate-y-1 transition-all"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Mail className="size-4.5" />
              </div>
              <h3 className="mt-3.5 text-sm font-extrabold text-foreground">Talk to Campus Team</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Direct emails for support, privacy officers, and college partnerships.
              </p>
            </Link>
          </div>
        </div>
      </main>

      <CleanFooter />
    </div>
  );
}
