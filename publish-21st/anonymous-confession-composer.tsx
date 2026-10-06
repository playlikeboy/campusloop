"use client";

import * as React from "react";
import { Check, Globe, Lock, School, Send, Sparkles, VenetianMask, X } from "lucide-react";

export interface ConfessionCategory {
  id: string;
  label: string;
  tag: string;
}

export interface AnonymousConfessionComposerProps {
  campusName?: string;
  categories?: ConfessionCategory[];
  onSubmitConfession?: (data: {
    content: string;
    category: string;
    scope: "campus" | "global";
  }) => void;
  className?: string;
}

const DEFAULT_CATEGORIES: ConfessionCategory[] = [
  { id: "hostel_lore", label: "Hostel Lore", tag: "#HostelLore" },
  { id: "placement_tea", label: "Placement Tea", tag: "#PlacementTea" },
  { id: "campus_crush", label: "Campus Crush", tag: "#CampusCrush" },
  { id: "exam_vent", label: "Exam Vent", tag: "#ExamVent" },
  { id: "prof_tales", label: "Professor Stories", tag: "#ProfTales" },
  { id: "unfiltered", label: "Unfiltered Reality", tag: "#Unfiltered" },
];

export function AnonymousConfessionComposer({
  campusName = "Stanford University",
  categories = DEFAULT_CATEGORIES,
  onSubmitConfession,
  className = "",
}: AnonymousConfessionComposerProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("hostel_lore");
  const [scope, setScope] = React.useState<"campus" | "global">("campus");
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const maxChars = 500;
  const charsRemaining = maxChars - content.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmitConfession?.({
      content,
      category: selectedCategory,
      scope,
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setContent("");
      setIsSubmitted(false);
      setIsExpanded(false);
    }, 2000);
  };

  return (
    <div
      className={`w-full max-w-xl rounded-3xl border border-border/60 bg-card p-5 text-card-foreground shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Collapsed Bar State */}
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/40 bg-muted/30 p-3 text-left transition-all hover:border-border/80 hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <VenetianMask className="size-5" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Drop an anonymous campus confession…</p>
              <p className="font-medium text-muted-foreground text-xs">
                Zero identity leakage. 100% cryptographically sealed.
              </p>
            </div>
          </div>
          <span className="rounded-xl bg-primary/10 px-3 py-1.5 font-black text-primary text-xs uppercase tracking-wider">
            Share
          </span>
        </button>
      ) : (
        /* Expanded Form State */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between border-border/40 border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <VenetianMask className="size-4" />
              </div>
              <span className="font-black text-foreground text-sm uppercase tracking-wider">
                Anonymous Drop
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Scope Toggle: Local Campus vs Global Feed */}
          <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-muted/20 p-1">
            <button
              type="button"
              onClick={() => setScope("campus")}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-1.5 font-bold text-xs transition-all ${
                scope === "campus"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <School className="size-3.5" />
              <span>{campusName}</span>
            </button>
            <button
              type="button"
              onClick={() => setScope("global")}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-1.5 font-bold text-xs transition-all ${
                scope === "global"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="size-3.5" />
              <span>All Universities (Global)</span>
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`cursor-pointer rounded-full px-3 py-1 font-semibold text-xs transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
              placeholder="What really happened in the campus library last night? Be respectful and honest..."
              rows={4}
              className="w-full resize-none rounded-2xl border border-border/50 bg-background/50 p-4 font-normal text-foreground text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span
              className={`absolute right-3 bottom-3 font-mono text-[11px] ${
                charsRemaining < 40 ? "font-bold text-destructive" : "text-muted-foreground"
              }`}
            >
              {charsRemaining}
            </span>
          </div>

          {/* Privacy Footnote & Submit Button */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="size-3 text-emerald-500" />
              <span>Identity disconnected at write time.</span>
            </div>

            <button
              type="submit"
              disabled={!content.trim() || isSubmitted}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full px-5 py-2.5 font-black text-xs transition-all active:scale-95 ${
                isSubmitted
                  ? "bg-emerald-500 text-white"
                  : content.trim()
                  ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              }`}
            >
              {isSubmitted ? (
                <>
                  <Check className="size-3.5" />
                  <span>Dropped into Feed</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Post Anonymously</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
