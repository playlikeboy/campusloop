"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PollSticker } from "@/components/ui/stickers/poll-sticker";
import type { FeedPost } from "@/hooks/use-feed";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface PollCardProps {
  post: FeedPost;
}

/** Feed poll: a flat poll sticker. Vote is optimistic and rolls back if the server says no. */
export function PollCard({ post }: PollCardProps) {
  const [hasVoted, setHasVoted] = useState(post.hasVotedPoll || false);
  const [options, setOptions] = useState(post.pollOptions || []);
  const [isLoading, setIsLoading] = useState(false);

  async function handleVote(optionId: string) {
    if (isLoading || hasVoted) return;
    sounds.tap();
    haptics.light();

    const before = options;
    setIsLoading(true);
    setHasVoted(true);
    setOptions((prev) =>
      prev.map((o) => (o.id === optionId ? { ...o, votesCount: o.votesCount + 1, userVoted: true } : o))
    );

    try {
      const res = await fetch(`/api/posts/${post.id}/poll-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      if (!res.ok) throw new Error("Failed to cast poll vote");
    } catch (err) {
      console.error(err);
      setHasVoted(false);
      setOptions(before);
      toast.error("Your vote didn't go through. Check your connection and tap again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PollSticker
      variant="flat"
      className="mt-2.5"
      showResults={hasVoted}
      disabled={isLoading}
      onVote={handleVote}
      options={options.map((o) => ({ id: o.id, label: o.text, votes: o.votesCount, chosen: o.userVoted }))}
    />
  );
}
