"use client";

import * as React from "react";
import { Check, ChevronDown, HelpCircle, Search, ThumbsDown, ThumbsUp, X } from "lucide-react";

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface VoxelFAQAccordionProps {
  heading?: string;
  subheading?: string;
  items?: FAQItem[];
  categories?: string[];
  className?: string;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    id: "1",
    category: "Verification",
    question: "How does college email verification work?",
    answer:
      "Sign up using your institutional domain (.ac.in or .edu). A one-time cryptographic confirmation link verifies active enrollment without exposing your private email publicly.",
  },
  {
    id: "2",
    category: "Academics",
    question: "Is access to notes and PYQs completely free?",
    answer:
      "Yes! The Academic Vault is 100% free for verified students. You can browse, download, and contribute lecture notes, syllabus roadmaps, and 5-year solved papers.",
  },
  {
    id: "3",
    category: "Privacy",
    question: "Can professors or peers trace anonymous confessions?",
    answer:
      "No. When posting anonymously, the link between your user profile and the post is severed at write-time. Only extreme statutory emergencies allow audited escrow review.",
  },
  {
    id: "4",
    category: "Security",
    question: "How are cyber-ragging and harassment prevented?",
    answer:
      "Automated doxxing filters redact phone numbers and hostel room IDs. Three independent user reports quarantine any post from the timeline within minutes.",
  },
];

const DEFAULT_CATEGORIES = ["All", "Verification", "Academics", "Privacy", "Security"];

export function VoxelFAQAccordion({
  heading = "Frequently Asked Questions",
  subheading = "Quick answers to help you navigate your digital campus experience.",
  items = DEFAULT_FAQS,
  categories = DEFAULT_CATEGORIES,
  className = "",
}: VoxelFAQAccordionProps) {
  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [openId, setOpenId] = React.useState<string | null>("1");
  const [helpful, setHelpful] = React.useState<Record<string, "yes" | "no">>({});

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchCat = activeCategory === "All" || item.category === activeCategory;
      if (!matchCat) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [items, activeCategory, search]);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleFeedback = (id: string, type: "yes" | "no") => {
    setHelpful((prev) => ({ ...prev, [id]: type }));
  };

  return (
    <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 select-none ${className}`}>
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-xs">
          <HelpCircle className="size-3.5" />
          <span>Help & Answers</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
          {heading}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          {subheading}
        </p>

        {/* Search Input */}
        <div className="relative pt-2 max-w-md mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions (e.g. notes, verification)..."
            className="w-full rounded-2xl border border-border/70 bg-card py-2.5 pl-10 pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-black"
                    : "border border-border/70 bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion Items */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
            No matching questions found.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOpen = openId === item.id;
            const feedbackState = helpful[item.id];

            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-3xl border transition-all duration-200 ${
                  isOpen
                    ? "border-primary/50 bg-card shadow-sm shadow-primary/5"
                    : "border-border/70 bg-card/80 hover:border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="pr-4 space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                      {item.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      {item.question}
                    </h3>
                  </div>

                  <div
                    className={`flex size-7 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-primary/10 text-primary" : ""
                    }`}
                  >
                    <ChevronDown className="size-3.5" />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border/40 px-4 sm:px-5 pt-3 pb-4 space-y-3">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>

                    {/* Feedback */}
                    <div className="flex items-center justify-between border-t border-border/30 pt-2.5 text-[11px] text-muted-foreground">
                      <span>Was this helpful?</span>
                      {feedbackState ? (
                        <span className="flex items-center gap-1 text-emerald-500 font-bold">
                          <Check className="size-3 stroke-[3]" />
                          <span>Thanks for your feedback!</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleFeedback(item.id, "yes")}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/60 bg-muted/30 hover:bg-muted text-foreground transition-colors cursor-pointer"
                          >
                            <ThumbsUp className="size-2.5 text-emerald-500" />
                            <span>Yes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(item.id, "no")}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/60 bg-muted/30 hover:bg-muted text-foreground transition-colors cursor-pointer"
                          >
                            <ThumbsDown className="size-2.5 text-red-500" />
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
    </div>
  );
}

export default VoxelFAQAccordion;
