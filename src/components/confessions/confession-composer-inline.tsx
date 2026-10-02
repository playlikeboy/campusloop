"use client";

import {
  Globe,
  Loader2,
  Lock,
  School,
  Send,
  ShieldCheck,
  Sparkles,
  VenetianMask,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export const CONFESSION_CATEGORIES = [
  { id: "hostel_lore", label: "Hostel Lore", tag: "#HostelLore" },
  { id: "placement_tea", label: "Placement Tea", tag: "#PlacementTea" },
  { id: "crush", label: "Campus Crush", tag: "#CampusCrush" },
  { id: "exam_vent", label: "Exam & Academics", tag: "#ExamVent" },
  { id: "prof_stories", label: "Professor Tales", tag: "#ProfTales" },
  { id: "unfiltered", label: "Unfiltered Reality", tag: "#Unfiltered" },
] as const;

interface ConfessionComposerInlineProps {
  scope: "CAMPUS" | "GLOBAL";
  campusName: string;
  onConfessionPosted?: (post: any) => void;
  className?: string;
}

export function ConfessionComposerInline({
  scope: initialScope,
  campusName,
  onConfessionPosted,
  className,
}: ConfessionComposerInlineProps) {
  const { profile } = useProfile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("hostel_lore");
  const [postScope, setPostScope] = useState<"CAMPUS" | "GLOBAL">(initialScope);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPostScope(initialScope);
  }, [initialScope]);

  useEffect(() => {
    if (isExpanded) {
      textareaRef.current?.focus();
    }
  }, [isExpanded]);

  const activeCategory = CONFESSION_CATEGORIES.find((c) => c.id === selectedCategory);
  const activePseudonym = profile?.anonymousUsername || "Anonymous Student";

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!body.trim()) {
      toast.error("Please whisper your confession before posting.");
      return;
    }

    if (body.trim().length < 5) {
      toast.error("Confessions must be at least 5 characters long.");
      return;
    }

    setIsSubmitting(true);
    sounds.tap();
    haptics.medium();

    let formattedBody = body.trim();
    if (activeCategory && !formattedBody.includes(activeCategory.tag)) {
      formattedBody = `${formattedBody}\n\n${activeCategory.tag}`;
    }

    const tempId = `temp_confession_${Date.now()}`;
    const optimisticPost = {
      id: tempId,
      body: formattedBody,
      title: null,
      type: "CONFESSION",
      scope: postScope,
      isAnonymous: true,
      pseudonym: activePseudonym,
      createdAt: new Date().toISOString(),
      votesCount: 0,
      commentsCount: 0,
      userVote: 0,
      author: null,
      institution: profile?.institution || {
        id: profile?.institutionId || "inst_global",
        name: campusName,
      },
    };

    onConfessionPosted?.(optimisticPost);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: formattedBody,
          type: "CONFESSION",
          scope: postScope,
          isAnonymous: true,
        }),
      });

      const data = (await res.json()) as any;

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to broadcast anonymous confession");
      }

      sounds.pop();
      haptics.success();
      toast.success("Confession whispered anonymously!", {
        description: "Sealed with cryptographic pseudonym. +5 Loop Points earned!",
      });

      setBody("");
      setIsExpanded(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error publishing confession");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-2xl border transition-all duration-300",
        isExpanded
          ? "border-purple-500/35 bg-purple-950/20 shadow-md shadow-purple-950/30 p-3.5 sm:p-4 backdrop-blur-xl"
          : "border-border/30 bg-card/40 hover:bg-card/70 hover:border-purple-500/30 p-2.5 sm:p-3 shadow-2xs cursor-pointer",
        className
      )}
    >
      {!isExpanded ? (
        /* Collapsed Fast Prompt */
        <div
          onClick={() => {
            sounds.tap();
            haptics.light();
            setIsExpanded(true);
          }}
          className="flex items-center gap-3 w-full min-w-0"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <VenetianMask className="size-4.5" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate select-none">
              Spill an anonymous campus secret or hostel vent...
            </p>
            <div className="flex items-center gap-2 text-[10px] text-purple-400/80 font-semibold select-none">
              <span className="flex items-center gap-1">
                <Lock className="size-2.5" />
                100% Cryptographically Sealed
              </span>
              <span>•</span>
              <span>Zero Profile Trace</span>
            </div>
          </div>

          <button
            type="button"
            className="hidden sm:inline-flex h-8 px-3.5 items-center justify-center rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            Spill Secret
          </button>
        </div>
      ) : (
        /* Expanded Whisper Composer */
        <form onSubmit={handleSubmit} className="space-y-3 animate-in fade-in zoom-in-98 duration-150">
          {/* Header & Cryptographic Notice */}
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/35">
                <VenetianMask className="size-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-tight text-foreground flex items-center gap-1.5">
                  Whisper as <span className="text-purple-400">@{activePseudonym}</span>
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="size-2.5 text-emerald-400" />
                  Real identity is AES-isolated &amp; never saved in feed rows
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.tap();
                setIsExpanded(false);
              }}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Close whisper box"
              aria-label="Close whisper box"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Textarea Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={4}
              maxLength={1000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What's the dark secret, hostel lore, or confession you can't tell anyone openly? Drop it here safely..."
              className="w-full bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none resize-none focus:outline-none selection:bg-purple-500/30 min-h-[90px]"
            />
          </div>

          {/* Category Chips Bar */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
              <Sparkles className="size-2.5 text-purple-400" />
              <span>Select Whisper Topic</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CONFESSION_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                      setSelectedCategory(cat.id);
                    }}
                    className={cn(
                      "h-7 px-2.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border select-none shrink-0",
                      isSelected
                        ? "bg-purple-500 text-white border-purple-400 shadow-xs shadow-purple-500/25 ring-1 ring-purple-400/40"
                        : "bg-muted/40 hover:bg-muted/70 text-muted-foreground border-border/40 hover:text-foreground"
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope Selection Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-500/15">
            <div className="flex items-center gap-1 p-0.5 rounded-full bg-muted/40 border border-border/40 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  setPostScope("GLOBAL");
                }}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full transition-all cursor-pointer",
                  postScope === "GLOBAL"
                    ? "bg-foreground text-background shadow-2xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="size-3" />
                <span>All India</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  setPostScope("CAMPUS");
                }}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full transition-all cursor-pointer max-w-[140px] sm:max-w-none truncate",
                  postScope === "CAMPUS"
                    ? "bg-foreground text-background shadow-2xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <School className="size-3 shrink-0" />
                <span className="truncate">{campusName}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/80 font-mono">
                {body.length} / 1000
              </span>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="h-8 px-3 rounded-full text-xs font-semibold text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !body.trim()}
                className="h-8 px-4 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-black transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-primary/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Sealing...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3" />
                    <span>Spill Secret</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
