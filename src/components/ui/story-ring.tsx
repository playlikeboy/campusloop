"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { StoryAvatarItem } from "@/components/stories/story-avatar-item";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { formatTimeAgo, initialOf } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

interface Story {
  id: string;
  mediaUrl?: string | null;
  text: string | null;
  backgroundColor: string | null;
  createdAt: string;
  expiresAt: string;
}

interface UserWithStories {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  stories: Story[];
  isFriend?: boolean;
}

interface StoryRingProps {
  users: UserWithStories[];
  mutateStories?: () => void;
}

export function StoryRing({ users }: StoryRingProps) {
  const { profile } = useProfile();
  const router = useRouter();

  const myStoryGroup = users.find((u) => u.id === profile?.id);
  // Unseen trays first (stable sort keeps the server's closeness order within each half).
  const otherUsers = users
    .filter((u) => u.id !== profile?.id)
    .map((u, idx) => ({ u, idx, seen: u.stories.every((st) => isStorySeen(st.id)) }))
    .sort((a, b) => Number(a.seen) - Number(b.seen) || a.idx - b.idx)
    .map(({ u }) => u);

  function isStorySeen(storyId: string) {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(`cl_seen_story_${storyId}`) === "1";
    } catch {
      return false;
    }
  }

  function handleOpenStory(storyId: string) {
    sounds.pop();
    haptics.light();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`cl_seen_story_${storyId}`, "1");
      } catch {
        // ignore
      }
    }
    router.push(`/story/${storyId}`);
  }

  function handleCreateStory() {
    sounds.tap();
    haptics.light();
    router.push("/stories/new");
  }

  return (
    <div className="flex h-[106px] w-full min-w-0 items-center gap-3.5 overflow-x-auto border-b border-border/25 px-4 py-2 no-scrollbar select-none bg-background/60">
      {/* 1. Add Story Circular Button (Reference Screenshot 1) */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 select-none">
        <button
          type="button"
          onClick={handleCreateStory}
          className="flex size-14 items-center justify-center rounded-full bg-brand-subtle text-brand-text transition-transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          aria-label="Add story"
        >
          <Plus className="size-6 stroke-[2.75]" />
        </button>
        <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[64px]">
          Add story
        </span>
      </div>

      {/* 2. Current User Story Item (if active) */}
      {myStoryGroup && myStoryGroup.stories.length > 0 && (
        <div className="flex shrink-0 flex-col items-center gap-1 select-none">
          <button
            type="button"
            onClick={() => handleOpenStory(myStoryGroup.stories[0].id)}
            className="rounded-full ring-2 ring-brand ring-offset-2 ring-offset-bg transition-transform active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
            aria-label="View your story"
          >
            <Avatar className="size-14 border border-background shadow-xs">
              <AvatarImage src={profile?.avatarUrl || ""} />
              <AvatarFallback className="font-bold text-xs bg-muted text-muted-foreground">
                {initialOf(profile?.displayName, "U")}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="flex flex-col items-center leading-tight">
            <span className="text-[11px] font-bold text-foreground">You</span>
            <span className="text-[9px] font-semibold text-primary">Active</span>
          </div>
        </div>
      )}

      {otherUsers.map((userGroup) => {
        const firstStory = userGroup.stories[0];
        if (!firstStory) return null;

        const allSeen = userGroup.stories.every((s) => isStorySeen(s.id));
        const timeAgo = formatTimeAgo(firstStory.createdAt);
        // Resume at the first story not yet watched.
        const startStory = userGroup.stories.find((s) => !isStorySeen(s.id)) ?? firstStory;

        return (
          <StoryAvatarItem
            key={userGroup.id}
            displayName={userGroup.displayName.split(" ")[0]}
            avatarUrl={userGroup.avatarUrl}
            subtitle={timeAgo}
            isFriend={userGroup.isFriend}
            hasUnseen={!allSeen}
            onClick={() => handleOpenStory(startStory.id)}
          />
        );
      })}

      {otherUsers.length === 0 && (
        <div className="flex items-center gap-2 pl-1 select-none">
          <div className="h-8 w-px bg-border/40 mr-1 hidden sm:block" />
          <button
            type="button"
            onClick={handleCreateStory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-dashed border-border hover:border-brand hover:bg-brand-subtle transition-colors text-fg-muted hover:text-fg cursor-pointer text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Plus className="size-3.5 shrink-0" aria-hidden />
            <span>Add a story</span>
          </button>
        </div>
      )}
    </div>
  );
}
