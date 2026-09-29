"use client";

import { Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { StoryAvatarItem } from "@/components/stories/story-avatar-item";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo } from "@/lib/utils";
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
  const otherUsers = users.filter((u) => u.id !== profile?.id);

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
          className="flex size-14 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/15 text-primary transition-transform active:scale-95 cursor-pointer border border-primary/20 shadow-2xs"
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
            className="rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background transition-transform active:scale-95 cursor-pointer"
            aria-label="View your story"
          >
            <Avatar className="size-14 border border-background shadow-xs">
              <AvatarImage src={profile?.avatarUrl || ""} />
              <AvatarFallback className="font-bold text-xs bg-muted text-muted-foreground">
                {(profile?.displayName?.[0] || "U").toUpperCase()}
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

        return (
          <StoryAvatarItem
            key={userGroup.id}
            displayName={userGroup.displayName.split(" ")[0]}
            avatarUrl={userGroup.avatarUrl}
            subtitle={timeAgo}
            isFriend={userGroup.isFriend}
            hasUnseen={!allSeen}
            onClick={() => handleOpenStory(firstStory.id)}
          />
        );
      })}

      {otherUsers.length === 0 && (
        <div className="flex items-center gap-2 pl-1 select-none">
          <div className="h-8 w-px bg-border/40 mr-1 hidden sm:block" />
          <button
            type="button"
            onClick={handleCreateStory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground cursor-pointer text-xs font-semibold"
          >
            <Sparkles className="size-3.5 text-primary shrink-0" />
            <span className="hidden sm:inline">No other campus vibes right now · Be the first to share!</span>
            <span className="sm:hidden">Drop today&apos;s campus vibe</span>
          </button>
        </div>
      )}
    </div>
  );
}
