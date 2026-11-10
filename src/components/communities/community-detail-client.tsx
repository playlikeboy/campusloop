"use client";

import { MessageSquarePlus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { recordCommunityInviteShare } from "@/app/(app)/(main)/communities/actions";
import { JoinCommunityButton } from "@/app/(app)/(main)/communities/join-community-button";
import { PostComposer } from "@/app/(app)/(main)/post/new/post-composer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedCard } from "@/components/ui/feed-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FeedPost } from "@/hooks/use-feed";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { CommunityDetailHero } from "./community-detail-hero";
import { CommunityMembersPanel, CommunityRulesPanel, CommunitySidebar } from "./community-detail-panels";

const FEED_FILTERS = [
  { key: "hot", label: "Popular" },
  { key: "new", label: "New" },
  { key: "top", label: "Top" },
  { key: "polls", label: "Polls & questions" },
] as const;

export interface CommunityDetailProps {
  community: {
    id: string;
    slug?: string | null;
    name: string;
    description?: string | null;
    category?: string;
    privacy?: string;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    points?: number;
    rules?: string | null;
    allowAnonymousPosts?: boolean;
    creatorId: string;
    createdAt: Date;
    creator?: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
    } | null;
  };
  initialPosts: FeedPost[];
  initialMembersCount: number;
  initialIsMember: boolean;
  isAdmin: boolean;
  relatedCommunities?: Array<{
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    category: string;
    avatarUrl?: string | null;
    membersCount: number;
    isMember?: boolean;
  }>;
  membersList?: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      headline?: string | null;
      points?: number | null;
    };
  }>;
}

export function CommunityDetailClient({
  community,
  initialPosts,
  initialMembersCount,
  initialIsMember,
  isAdmin,
  relatedCommunities = [],
  membersList = [],
}: CommunityDetailProps) {
  const router = useRouter();
  const { profile } = useProfile();

  const [activeTab, setActiveTab] = useState<"discussions" | "members" | "rules">("discussions");
  const [feedFilter, setFeedFilter] = useState<"hot" | "new" | "top" | "polls">("hot");
  const [topTimeWindow] = useState<"today" | "week" | "month" | "all">("all");
  const [isMember, setIsMember] = useState(initialIsMember);
  const [membersCount, setMembersCount] = useState(initialMembersCount);
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [showFullComposer, setShowFullComposer] = useState(false);

  const identifier = community.slug || community.id;

  async function handleOpenCommunityChat() {
    if (isOpeningChat) return;
    setIsOpeningChat(true);
    haptics.light();

    try {
      const res = await fetch(`/api/communities/${community.id}/chat`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Couldn't open the group chat. Try again.");
      }
      const data = (await res.json()) as { conversationId: string };
      router.push(`/chat/${data.conversationId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't open the group chat. Try again.");
    } finally {
      setIsOpeningChat(false);
    }
  }

  async function handleShareInvite() {
    haptics.light();
    const url = `${window.location.origin}/communities/${identifier}`;
    try {
      await navigator.clipboard.writeText(`Join c/${community.name} on CampusLoop\n${url}`);
      toast.success("Invite link copied");
      recordCommunityInviteShare(community.id).catch(() => {});
    } catch {
      toast.error("Couldn't copy the link. Copy it from the address bar.");
    }
  }

  const parsedRules = useMemo(() => {
    if (!community.rules) return [];
    try {
      return JSON.parse(community.rules) as Array<{ title: string; description: string }>;
    } catch {
      return [];
    }
  }, [community.rules]);

  const [referenceTime] = useState(() => Date.now());

  // Algorithmic Community Feed Sorting
  const filteredPosts = useMemo(() => {
    const list = [...posts];
    if (feedFilter === "polls") {
      return list.filter((p) => p.type === "POLL" || p.type === "QUESTION");
    }

    const now = referenceTime;

    switch (feedFilter) {
      case "new":
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      case "top": {
        let maxAgeMs = Infinity;
        if (topTimeWindow === "today") maxAgeMs = 24 * 3600 * 1000;
        else if (topTimeWindow === "week") maxAgeMs = 7 * 24 * 3600 * 1000;
        else if (topTimeWindow === "month") maxAgeMs = 30 * 24 * 3600 * 1000;

        const timeFiltered = list.filter((p) => now - new Date(p.createdAt).getTime() <= maxAgeMs);
        const candidates = timeFiltered.length > 0 ? timeFiltered : list;
        return candidates.sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0));
      }
      default:
        return list.sort((a, b) => {
          const ageHoursA = Math.max(1, (now - new Date(a.createdAt).getTime()) / (3600 * 1000));
          const ageHoursB = Math.max(1, (now - new Date(b.createdAt).getTime()) / (3600 * 1000));
          const scoreA = (a.votesCount * 2 + a.commentsCount * 3 + 5) / ageHoursA ** 0.7;
          const scoreB = (b.votesCount * 2 + b.commentsCount * 3 + 5) / ageHoursB ** 0.7;
          return scoreB - scoreA;
        });
    }
  }, [posts, feedFilter, topTimeWindow, referenceTime]);

  useEffect(() => {
    if (!showFullComposer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowFullComposer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showFullComposer]);

  function handleMembershipChange(joined: boolean) {
    setIsMember(joined);
    setMembersCount((c) => Math.max(joined ? c + 1 : c - 1, 0));
  }

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-4 px-4 pt-3 pb-24">
      <CommunityDetailHero
        community={community}
        identifier={identifier}
        isAdmin={isAdmin}
        isMember={isMember}
        membersCount={membersCount}
        postsCount={posts.length}
        isOpeningChat={isOpeningChat}
        onOpenChat={handleOpenCommunityChat}
        onCopyInvite={handleShareInvite}
        onMembershipChange={handleMembershipChange}
        onShowMembers={() => setActiveTab("members")}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="min-w-0 gap-4 lg:col-span-8"
        >
          <TabsList
            variant="line"
            aria-label="Community sections"
            className="no-scrollbar w-full overflow-x-auto"
          >
            <TabsTrigger value="discussions">Posts</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="discussions" className="space-y-4">
            {isMember ? (
              <button
                type="button"
                onClick={() => setShowFullComposer(true)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-ui hover:border-border-strong"
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={profile?.avatarUrl || ""} alt="" />
                  <AvatarFallback>{(profile?.displayName || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm text-fg-subtle">Post in c/{community.name}</span>
                <span className="inline-flex h-9 items-center gap-1 rounded-full bg-brand px-4 text-sm font-semibold text-brand-fg">
                  <Plus className="size-4" aria-hidden="true" />
                  Post
                </span>
              </button>
            ) : (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-fg">Join c/{community.name} to post, vote and chat.</p>
                <JoinCommunityButton
                  communityId={community.id}
                  initialIsMember={false}
                  onMembershipChange={handleMembershipChange}
                />
              </div>
            )}

            {posts.length > 0 && (
              <fieldset className="no-scrollbar flex gap-2 overflow-x-auto">
                <legend className="sr-only">Sort posts</legend>
                {FEED_FILTERS.map((f) => (
                  <Chip
                    key={f.key}
                    size="sm"
                    selected={feedFilter === f.key}
                    onClick={() => {
                      haptics.light();
                      setFeedFilter(f.key);
                    }}
                  >
                    {f.label}
                  </Chip>
                ))}
              </fieldset>
            )}

            {filteredPosts.length > 0 ? (
              <div className="space-y-3">
                {filteredPosts.map((post) => (
                  <FeedCard key={post.id} post={post} currentUserId={profile?.id} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MessageSquarePlus}
                bordered
                title={posts.length > 0 ? "No polls or questions yet" : "No posts here yet"}
                description={
                  isMember ? "Start the first conversation." : "Join to start the first conversation."
                }
                action={
                  isMember ? (
                    <Button onClick={() => setShowFullComposer(true)}>
                      <Plus />
                      Write a post
                    </Button>
                  ) : undefined
                }
              />
            )}
          </TabsContent>

          <TabsContent value="members">
            <CommunityMembersPanel members={membersList} />
          </TabsContent>

          <TabsContent value="rules">
            <CommunityRulesPanel rules={parsedRules} />
          </TabsContent>
        </Tabs>

        <div className="lg:col-span-4">
          <CommunitySidebar community={community} relatedCommunities={relatedCommunities} />
        </div>
      </div>

      {showFullComposer && (
        <div
          className="fixed inset-0 z-(--z-modal) flex items-start justify-center overflow-y-auto bg-overlay p-0 sm:p-6"
          onClick={() => setShowFullComposer(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Post in c/${community.name}`}
            className="w-full max-w-2xl sm:my-4"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <PostComposer
              variant="modal"
              communityId={community.id}
              allowAnonymous={community.allowAnonymousPosts ?? true}
              lockedCommunityName={community.name}
              onCancel={() => setShowFullComposer(false)}
              onPublished={(post) => {
                setPosts((prev) => [post, ...prev]);
                setShowFullComposer(false);
              }}
              onPublishConfirmed={(tempId, realPost) => {
                setPosts((prev) =>
                  realPost
                    ? prev.map((p) => (p.id === tempId ? realPost : p))
                    : prev.filter((p) => p.id !== tempId)
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
