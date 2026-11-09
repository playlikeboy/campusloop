"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, GraduationCap, Mail, Search, ShieldAlert, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { CATEGORIES, FAQS } from "./faqs";

const QUICK_LINKS = [
  {
    href: "/college-request",
    icon: GraduationCap,
    title: "Missing your college?",
    description: "Request your college and its email domain.",
  },
  {
    href: "/safety",
    icon: ShieldAlert,
    title: "Urgent safety concern?",
    description: "Anti-ragging helplines, reporting and emergency contacts.",
  },
  {
    href: "/contact",
    icon: Mail,
    title: "Talk to the team",
    description: "Support, privacy requests and college partnerships.",
  },
];

export function HelpClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [openId, setOpenId] = useState<string | null>("verify-1");
  const [feedback, setFeedback] = useState<Record<string, "yes" | "no">>({});

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === CATEGORIES[0] || faq.category === selectedCategory;
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
    <main className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-fg">Help and frequently asked questions</h1>
          <p className="mx-auto max-w-lg text-base leading-relaxed text-fg-muted">
            College email verification, the Academic Vault, anonymous posting and student safety.
          </p>

          <div className="relative mx-auto max-w-lg pt-4">
            <label htmlFor="help-search" className="sr-only">
              Search questions
            </label>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 translate-y-1 text-fg-subtle" aria-hidden />
            <input
              id="help-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search, for example notes or verification"
              className="h-12 w-full rounded-md border border-border bg-surface pl-11 pr-10 text-base text-fg placeholder:text-fg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex size-8 translate-y-1 items-center justify-center rounded-full text-fg-muted hover:bg-surface-muted hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setSelectedCategory(cat);
                  }}
                  className={cn(
                    "h-10 rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-brand text-brand-fg"
                      : "border border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="space-y-2 rounded-lg border border-border bg-surface p-6 py-12 text-center">
              <p className="text-base font-semibold text-fg">No matching questions</p>
              <p className="text-sm text-fg-muted">Try different words, or write to the support desk.</p>
              <div className="pt-2">
                <Link
                  href="/contact"
                  className="inline-flex h-10 items-center gap-1.5 rounded-md bg-brand px-4 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
                >
                  <Mail className="size-4" aria-hidden />
                  <span>Contact support</span>
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
                  className={cn("overflow-hidden rounded-lg border bg-surface", isOpen ? "border-border-strong" : "border-border")}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="flex w-full items-center justify-between p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    aria-expanded={isOpen}
                  >
                    <div className="space-y-1 pr-4">
                      <span className="block text-xs font-medium text-fg-subtle">{faq.category}</span>
                      <h2 className="text-base font-semibold text-fg">{faq.question}</h2>
                    </div>
                    <ChevronDown
                      className={cn("size-5 shrink-0 text-fg-muted transition-transform", isOpen && "rotate-180")}
                      aria-hidden
                    />
                  </button>

                  {isOpen && (
                    <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
                      <p className="text-sm leading-relaxed text-fg-muted">{faq.answer}</p>

                      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-fg-muted">
                        <span>Was this helpful?</span>
                        {userFeedback ? (
                          <span className="flex items-center gap-1 font-medium text-success">
                            <Check className="size-4" aria-hidden />
                            <span>Thanks for the feedback</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleFeedback(faq.id, "yes")}
                              className="flex h-9 items-center gap-1 rounded-md border border-border px-2.5 text-fg hover:bg-surface-muted"
                            >
                              <ThumbsUp className="size-3.5" aria-hidden />
                              <span>Yes</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(faq.id, "no")}
                              className="flex h-9 items-center gap-1 rounded-md border border-border px-2.5 text-fg hover:bg-surface-muted"
                            >
                              <ThumbsDown className="size-3.5" aria-hidden />
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

        <div className="grid gap-4 pt-6 sm:grid-cols-3">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex size-9 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
                  <Icon className="size-4" aria-hidden />
                </div>
                <h3 className="mt-3.5 text-base font-semibold text-fg">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
