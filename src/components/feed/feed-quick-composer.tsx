"use client";

import { BarChart3, HelpCircle, ImageIcon, VenetianMask } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QuestionSticker } from "@/components/ui/stickers";
import { MAX_POST_CHARS } from "@/constants";
import type { FeedPost } from "@/hooks/use-feed";
import type { useProfile } from "@/hooks/use-profile";
import { confirmOptimisticPost, optimisticAddPost, revertOptimisticPost } from "@/lib/feed-mutations";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

type Profile = ReturnType<typeof useProfile>["profile"];

const SHORTCUTS = [
  { type: "NORMAL", icon: ImageIcon, label: "Photo" },
  { type: "POLL", icon: BarChart3, label: "Poll" },
  { type: "QUESTION", icon: HelpCircle, label: "Question" },
  { type: "CONFESSION", icon: VenetianMask, label: "Anonymous" },
] as const;

function buildOptimisticPost(text: string, profile: Profile, scope: "CAMPUS" | "GLOBAL"): FeedPost {
  return {
    id: `temp_${Date.now()}`,
    authorId: profile?.id || "temp_author",
    institutionId: profile?.institutionId || "inst_global",
    body: text,
    type: "NORMAL",
    scope,
    isAnonymous: false,
    pseudonym: null,
    title: null,
    status: "PUBLISHED",
    riskScore: 0,
    isEdited: false,
    isSeeded: false,
    repostOfId: null,
    repostComment: null,
    communityId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    votesCount: 0,
    commentsCount: 0,
    userVote: 0,
    author: profile as unknown as FeedPost["author"],
    institution: (profile?.institution || {
      id: profile?.institutionId || "inst_global",
      name: "Campus",
    }) as unknown as FeedPost["institution"],
  };
}

/** Desktop inline composer in the question-box style: type and post plain text, or jump to the full editor. */
export function FeedQuickComposer({ profile, scope }: { profile: Profile; scope: "CAMPUS" | "GLOBAL" }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const trimmed = text.trim();
  const overLimit = text.length > MAX_POST_CHARS;
  const canPost = trimmed.length > 0 && !overLimit && !isPosting;

  function openFullEditor(type: string) {
    const params = new URLSearchParams();
    if (type !== "NORMAL") params.set("type", type);
    if (trimmed) params.set("text", trimmed);
    const query = params.toString();
    router.push(query ? `/post/new?${query}` : "/post/new");
  }

  async function publish() {
    if (!canPost) return;
    setIsPosting(true);
    setText("");

    const optimisticPost = buildOptimisticPost(trimmed, profile, scope);
    sounds.ting();
    haptics.success();
    optimisticAddPost(optimisticPost);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed, type: "NORMAL", scope, isAnonymous: false }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Couldn't post. Try again in a moment.");
      }
      const serverPost = (await res.json()) as { id: string; createdAt?: string | Date };
      confirmOptimisticPost(optimisticPost.id, {
        ...optimisticPost,
        id: serverPost.id,
        createdAt: serverPost.createdAt ? new Date(serverPost.createdAt) : optimisticPost.createdAt,
      });
      toast.success("Posted");
    } catch (err: unknown) {
      revertOptimisticPost(optimisticPost.id);
      setText(trimmed);
      toast.error(err instanceof Error ? err.message : "Couldn't post. Check your internet and try again.");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <section aria-label="Write a post" className="hidden md:block border-b border-border px-5 pt-4 pb-3">
      <QuestionSticker
        variant="flat"
        prompt="What's happening on campus?"
        placeholder="Share a thought, ask something, or start a poll"
        value={text}
        onChange={setText}
        onSubmit={() => publish()}
        submitLabel="Post"
        maxLength={MAX_POST_CHARS}
        loading={isPosting}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            publish();
          }
        }}
      />
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {SHORTCUTS.map((shortcut) => (
          <Button
            key={shortcut.type}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => openFullEditor(shortcut.type)}
            className="text-fg-muted hover:text-fg"
          >
            <shortcut.icon className="size-4" aria-hidden />
            {shortcut.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
