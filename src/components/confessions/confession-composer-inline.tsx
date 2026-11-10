"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Chip } from "@/components/ui/chip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { QuestionSticker } from "@/components/ui/stickers";
import { MAX_POST_CHARS } from "@/constants";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
export const CONFESSION_CATEGORIES = [
  { id: "hostel_lore", label: "Hostel", tag: "#HostelLore" },
  { id: "placement_tea", label: "Placements", tag: "#PlacementTea" },
  { id: "crush", label: "Crush", tag: "#CampusCrush" },
  { id: "exam_vent", label: "Exams", tag: "#ExamVent" },
  { id: "prof_stories", label: "Profs", tag: "#ProfTales" },
  { id: "unfiltered", label: "Anything else", tag: "#Unfiltered" },
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
  const [body, setBody] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("hostel_lore");
  const [postScope, setPostScope] = useState<"CAMPUS" | "GLOBAL">(initialScope);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPostScope(initialScope);
  }, [initialScope]);

  const activeCategory = CONFESSION_CATEGORIES.find((c) => c.id === selectedCategory);
  const activePseudonym = profile?.anonymousUsername || "anonymous";

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!body.trim()) {
      toast.error("Write something first.");
      return;
    }

    if (body.trim().length < 5) {
      toast.error("Write at least 5 characters.");
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
        throw new Error(data.error || "Couldn't post your confession. Try again.");
      }

      sounds.pop();
      haptics.success();
      toast.success("Posted anonymously");

      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't post. Check your internet and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <QuestionSticker
        variant="flat"
        prompt="Confess anonymously"
        placeholder="Say what you can't say out loud…"
        value={body}
        onChange={setBody}
        onSubmit={() => handleSubmit()}
        submitLabel="Post anonymously"
        maxLength={MAX_POST_CHARS}
        loading={isSubmitting}
      />

      <p className="flex items-center gap-1.5 text-xs text-fg-muted">
        <Lock className="size-3.5" aria-hidden />
        Posting as <span className="font-semibold text-fg">@{activePseudonym}</span>. Your real name stays
        hidden.
      </p>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-fg-muted">Topic</legend>
        <div className="flex flex-wrap gap-1.5">
          {CONFESSION_CATEGORIES.map((cat) => (
            <Chip
              key={cat.id}
              size="sm"
              selected={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-fg-muted">Who can see it</legend>
        <SegmentedControl
          size="sm"
          value={postScope}
          onChange={setPostScope}
          options={[
            { value: "GLOBAL", label: "All colleges" },
            { value: "CAMPUS", label: `Only ${campusName}` },
          ]}
        />
      </fieldset>
    </div>
  );
}
