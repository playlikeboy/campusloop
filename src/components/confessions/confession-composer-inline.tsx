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
        "relative rounded-xl border transition-all duration-200",
        isExpanded
          ? "border-purple-500/30 bg-card/80 shadow-md p-3 sm:p-3.5 backdrop-blur-md"
          : "border-border/30 bg-muted/20 hover:bg-muted/35 hover:border-border/50 p-2 sm:p-2.5 cursor-pointer",
        className
      )}
    >
      {!isExpanded ? (
        /* Collapsed Compact Input Entry Point */
        <div
          onClick={() => {
            sounds.tap();
            haptics.light();
            setIsExpanded(true);
          }}
          className="flex items-center gap-2.5 w-full min-w-0"
        >
          <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <VenetianMask className="size-4" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate select-none">
              Spill an anonymous campus secret or hostel tea...
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 select-none mt-0.5">
              <span className="flex items-center gap-1">
                <Lock className="size-2.5 text-emerald-400/90" />
                100% Anonymous
              </span>
              <span>·</span>
              <span>Zero Profile Trace</span>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-7 px-3 items-center justify-center rounded-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            Whisper
          </button>
        </div>
      ) : (
        /* Expanded Whisper Composer */
        <form onSubmit={handleSubmit} className="space-y-2.5 animate-in fade-in zoom-in-98 duration-150">
          {/* Header & Cryptographic Notice */}
          <div className="flex items-center justify-between border-b border-border/20 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-6.5 items-center justify-center rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/25 shrink-0">
                <VenetianMask className="size-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold tracking-tight text-foreground truncate flex items-center gap-1">
                  Whisper as <span className="text-purple-400">@{activePseudonym}</span>
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                  <ShieldCheck className="size-2.5 text-emerald-400 shrink-0" />
                  Real identity is cryptographic &amp; never exposed
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.tap();
                setIsExpanded(false);
              }}
              className="flex size-6.5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shrink-0 ml-1"
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
              rows={3}
              maxLength={1000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What's the secret, hostel lore, or confession you can't tell anyone openly? Drop it here safely..."
              className="w-full bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none resize-none focus:outline-none selection:bg-purple-500/30 min-h-[75px]"
            />
          </div>

          {/* Category Chips Bar */}
          <div className="space-y-1 pt-0.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
              <Sparkles className="size-2.5 text-purple-400" />
              <span>Topic</span>
            </label>
            <div className="flex flex-wrap gap-1">
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
                      "h-6 px-2 rounded-full text-[11px] font-medium transition-all cursor-pointer border select-none shrink-0",
                      isSelected
                        ? "bg-purple-600/25 text-purple-300 border-purple-500/40 font-semibold shadow-2xs"
                        : "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-border/25 hover:text-foreground"
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope Selection Pill Bar & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/15">
            <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-muted/30 border border-border/30 text-[10px] font-medium">
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  setPostScope("GLOBAL");
                }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-all cursor-pointer",
                  postScope === "GLOBAL"
                    ? "bg-foreground text-background font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="size-2.5" />
                <span>All India</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  setPostScope("CAMPUS");
                }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-all cursor-pointer max-w-[130px] truncate",
                  postScope === "CAMPUS"
                    ? "bg-foreground text-background font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <School className="size-2.5 shrink-0" />
                <span className="truncate">{campusName}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                {body.length}/1000
              </span>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="h-7 px-2.5 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !body.trim()}
                className="h-7 px-3.5 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    <span>Sealing...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3" />
                    <span>Post</span>
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
