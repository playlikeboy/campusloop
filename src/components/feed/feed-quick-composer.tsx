"use client";

import { BarChart3, HelpCircle, ImageIcon, Loader2, VenetianMask } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MAX_POST_CHARS } from "@/constants";
import type { FeedPost } from "@/hooks/use-feed";
import type { useProfile } from "@/hooks/use-profile";
import { confirmOptimisticPost, optimisticAddPost, revertOptimisticPost } from "@/lib/feed-mutations";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

type Profile = ReturnType<typeof useProfile>["profile"];

const SHORTCUTS = [
  { type: "NORMAL", icon: ImageIcon, label: "Add photo or video" },
  { type: "POLL", icon: BarChart3, label: "Create a poll" },
  { type: "QUESTION", icon: HelpCircle, label: "Ask a question" },
  { type: "CONFESSION", icon: VenetianMask, label: "Post anonymously" },
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

/** Desktop inline composer: type and post plain text, or jump to the full editor. */
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
        throw new Error(err.error || "Failed to publish post");
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
      toast.error(err instanceof Error ? err.message : "Failed to publish post.");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        publish();
      }}
      className="hidden md:flex gap-3 border-b border-border/40 px-5 pt-4 pb-3"
    >
      <Avatar className="size-10 shrink-0 rounded-full">
        <AvatarImage src={profile?.avatarUrl || ""} />
        <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">
          {profile?.displayName?.[0] || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <label htmlFor="feed-quick-composer" className="sr-only">
          Write a post
        </label>
        <textarea
          id="feed-quick-composer"
          rows={trimmed ? 3 : 1}
          placeholder="What's happening on campus?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              publish();
            }
          }}
          className="w-full resize-none border-0 bg-transparent py-2 text-lg leading-snug text-foreground placeholder:text-muted-foreground outline-none focus:ring-0"
        />

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="-ml-2 flex items-center">
            {SHORTCUTS.map((shortcut) => (
              <button
                key={shortcut.type}
                type="button"
                title={shortcut.label}
                aria-label={shortcut.label}
                onClick={() => openFullEditor(shortcut.type)}
                className="flex size-9 items-center justify-center rounded-full text-primary hover:bg-primary/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <shortcut.icon className="size-4.5" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {text.length > MAX_POST_CHARS - 200 && (
              <span
                className={cn(
                  "text-xs tabular-nums",
                  overLimit ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {MAX_POST_CHARS - text.length}
              </span>
            )}
            <button
              type="submit"
              disabled={!canPost}
              className="flex h-9 min-w-18 items-center justify-center rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPosting ? <Loader2 className="size-4 animate-spin" /> : "Post"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
