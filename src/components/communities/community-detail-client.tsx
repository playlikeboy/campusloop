"use client";

import {
  ArrowLeft,
  BarChart3,
  Check,
  Clock,
  Compass,
  Flame,
  Globe,
  Image as ImageIcon,
  Loader2,
  Lock,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Settings,
  Share2,
  ShieldCheck,
  Smile,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  VenetianMask,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { recordCommunityInviteShare } from "@/app/(app)/(main)/communities/actions";
import { JoinCommunityButton } from "@/app/(app)/(main)/communities/join-community-button";
import { PostComposer } from "@/app/(app)/(main)/post/new/post-composer";
import { ShareQrButton } from "@/components/common/share-qr-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeedCard } from "@/components/ui/feed-card";
import type { FeedPost } from "@/hooks/use-feed";
import { useProfile } from "@/hooks/use-profile";
import { confirmOptimisticPost, optimisticAddPost, revertOptimisticPost } from "@/lib/feed-mutations";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

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
  const [topTimeWindow, setTopTimeWindow] = useState<"today" | "week" | "month" | "all">("all");
  const [isMember, setIsMember] = useState(initialIsMember);
  const [membersCount, setMembersCount] = useState(initialMembersCount);
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [copied, setCopied] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  // Quick Composer State
  const [quickText, setQuickText] = useState("");
  const [isQuickPosting, setIsQuickPosting] = useState(false);
  const [showFullComposer, setShowFullComposer] = useState(false);

  const identifier = community.slug || community.id;

  async function handleOpenCommunityChat() {
    if (isOpeningChat) return;
    setIsOpeningChat(true);
    sounds.tap();
    haptics.light();

    try {
      const res = await fetch(`/api/communities/${community.id}/chat`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Failed to open community chat room");
      }
      const data = (await res.json()) as { conversationId: string };
      router.push(`/chat/${data.conversationId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to open chat room");
    } finally {
      setIsOpeningChat(false);
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

  // Reddit-Style Algorithmic Community Feed Sorting
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
      case "hot":
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

  async function handleShareInvite() {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/communities/${identifier}`
        : `https://campusloop.space/communities/${identifier}`;

    const shareText = `🚀 Join c/${community.name} on CampusLoop!\n${community.description || "Campus sub-hub for students."}\n\n👉 ${shareUrl}`;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("Community invite link copied! +10 LP awarded 🚀");
      setTimeout(() => setCopied(false), 2500);
      recordCommunityInviteShare(community.id).catch(() => {});
    }
  }

  async function handleQuickPost(e: React.FormEvent) {
    e.preventDefault();
    const text = quickText.trim();
    if (!text || isQuickPosting) return;

    setIsQuickPosting(true);
    setQuickText("");

    const tempId = `temp_${Date.now()}`;
    const optimisticPost: FeedPost = {
      id: tempId,
      authorId: profile?.id || "temp_author",
      institutionId: profile?.institutionId || "inst_global",
      communityId: community.id,
      body: text,
      type: "NORMAL",
      scope: "CAMPUS",
      isAnonymous: false,
      pseudonym: null,
      title: null,
      status: "PUBLISHED",
      riskScore: 0,
      isEdited: false,
      isSeeded: false,
      repostOfId: null,
      repostComment: null,
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
      community: { id: community.id, name: community.name },
    };

    setPosts((prev) => [optimisticPost, ...prev]);
    optimisticAddPost(optimisticPost);
    toast.success("Discussion posted! 🎉");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: text,
          type: "NORMAL",
          scope: "CAMPUS",
          isAnonymous: false,
          communityId: community.id,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to publish post");
      }

      const serverPost = (await res.json()) as { id: string; createdAt?: string | Date };
      const confirmed = {
        ...optimisticPost,
        id: serverPost.id,
        createdAt: new Date(serverPost.createdAt || Date.now()),
      };
      setPosts((prev) => prev.map((p) => (p.id === tempId ? confirmed : p)));
      confirmOptimisticPost(tempId, confirmed);
    } catch (err: unknown) {
      console.error("Community post failed:", err);
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
      revertOptimisticPost(tempId);
      toast.error(err instanceof Error ? err.message : "Failed to publish post.");
    } finally {
      setIsQuickPosting(false);
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* ─── Breadcrumb & Quick Controls ─── */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
        >
          <div className="size-7 rounded-full bg-muted/50 group-hover:bg-muted flex items-center justify-center transition-colors">
            <ArrowLeft className="size-3.5" />
          </div>
          <span>Back to Hubs</span>
        </button>

        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <Link
              href={`/communities/${identifier}/settings`}
              className="flex size-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              title="Community Settings"
            >
              <Settings className="size-3.5" />
            </Link>
          )}

          <button
            type="button"
            onClick={handleShareInvite}
            className="flex size-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            title="Copy invite link"
          >
            {copied ? <Check className="size-3.5 text-primary" /> : <Share2 className="size-3.5" />}
          </button>

          <ShareQrButton
            title={`c/${community.name}`}
            subtitle={community.description || "Campus sub-hub on CampusLoop"}
            badgeText="Campus Sub-Hub"
            shortUrl={`https://campusloop.space/c/${identifier}`}
            avatarUrl={community.avatarUrl}
            category="community"
            className="size-8 border-border/60 bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          />
        </div>
      </div>

      {/* ─── Hero Banner & Header Card (Vibrant Aesthetic, No Stark Black) ─── */}
      <div className="relative rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
        {/* Banner Area */}
        <div className="relative h-40 sm:h-52 w-full overflow-hidden">
          {community.bannerUrl ? (
            <img
              src={community.bannerUrl}
              alt={`${community.name} Banner`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-950/70 via-teal-900/40 to-slate-950 relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/25 via-teal-600/10 to-transparent" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/50 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white/90">
                <Sparkles className="size-3 text-emerald-400" />
                <span>Verified Campus Hub</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Bar & Avatar */}
        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="flex items-end gap-4">
              <Avatar className="size-24 sm:size-28 rounded-2xl border-4 border-background bg-card shadow-2xl ring-2 ring-primary/20 shrink-0">
                <AvatarImage
                  src={community.avatarUrl || ""}
                  alt={community.name}
                  className="object-cover rounded-2xl"
                />
                <AvatarFallback className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white text-2xl font-black rounded-2xl shadow-inner flex items-center justify-center">
                  {community.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1 pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    {community.name}
                  </h1>
                  {community.privacy === "PRIVATE" ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[11px] font-bold">
                      <Lock className="size-3" /> Private
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-bold">
                      <Globe className="size-3" /> Public Hub
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-primary">
                  {community.category || "General"} · c/{community.name}
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenCommunityChat}
                disabled={isOpeningChat}
                className="h-10 px-4 text-xs font-black rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-2 shrink-0"
                title={`Join c/${community.name} chat room`}
              >
                {isOpeningChat ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="size-3.5" />
                )}
                <span>Chat Room</span>
              </button>

              <JoinCommunityButton
                communityId={community.id}
                initialIsMember={isMember}
                onMembershipChange={(joined) => {
                  setIsMember(joined);
                  setMembersCount((c) => Math.max(joined ? c + 1 : c - 1, 0));
                }}
                className={cn(
                  "h-10 px-5 text-xs font-black rounded-full transition-all cursor-pointer shadow-xs active:scale-95",
                  isMember
                    ? "border border-border/80 bg-muted/40 text-foreground hover:border-destructive/60 hover:text-destructive hover:bg-destructive/5"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              />
            </div>
          </div>

          {/* Description & Fast Stats */}
          <div className="space-y-3 pt-1">
            {community.description && (
              <p className="text-sm text-foreground/90 font-normal leading-relaxed max-w-3xl">
                {community.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground pt-1 border-t border-border/30">
              <button
                type="button"
                onClick={() => setActiveTab("members")}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
              >
                <Users className="size-3.5 text-primary" />
                <span className="font-bold text-foreground">{membersCount}</span> Members
              </button>

              <div className="flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-blue-500" />
                <span className="font-bold text-foreground">{posts.length}</span> Discussions
              </div>

              {community.creator && (
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  <span>
                    Moderated by{" "}
                    <Link
                      href={`/@${community.creator.username}`}
                      className="font-bold text-foreground hover:underline"
                    >
                      @{community.creator.username}
                    </Link>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Desktop 12-Column Responsive Workspace Grid (Full PC Utilization) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── Main Content Stream (8 cols) ─── */}
        <div className="lg:col-span-8 space-y-4">
          {/* Unified Primary Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <div className="flex items-center gap-1">
              {[
                { key: "discussions", label: "Discussions", icon: MessageSquare },
                { key: "members", label: `Members (${membersCount})`, icon: Users },
                { key: "rules", label: "Rules & Guidelines", icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                      isSelected
                        ? "bg-foreground text-background shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter Pills when on Discussions tab */}
            {activeTab === "discussions" && (
              <div className="flex items-center gap-1">
                {[
                  { key: "hot", label: "Hot", icon: Flame },
                  { key: "new", label: "New", icon: Clock },
                  { key: "top", label: "Top", icon: Trophy },
                  { key: "polls", label: "Polls", icon: BarChart3 },
                ].map((f) => {
                  const Icon = f.icon;
                  const active = feedFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFeedFilter(f.key as typeof feedFilter)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer",
                        active
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <Icon className="size-3" />
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Time range selector for Top filter */}
          {activeTab === "discussions" && feedFilter === "top" && (
            <div className="flex items-center justify-end gap-1.5 text-[11px] font-bold pt-1">
              <span className="text-muted-foreground">Top period:</span>
              {(["today", "week", "month", "all"] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTopTimeWindow(range)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px] transition-all cursor-pointer",
                    topTimeWindow === range
                      ? "bg-foreground text-background font-black"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  {range === "today" ? "24h" : range === "week" ? "Week" : range === "month" ? "Month" : "All"}
                </button>
              ))}
            </div>
          )}

          {/* ─── Tab Content Views ─── */}
          {activeTab === "members" ? (
            /* Members Directory */
            <div className="rounded-2xl border border-border/30 bg-card/40 divide-y divide-border/20 overflow-hidden">
              {membersList.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No public member list available for this sub-hub.
                </div>
              ) : (
                membersList.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <Link href={`/@${m.user.username}`} className="flex items-center gap-3">
                      <Avatar className="size-10 rounded-full border border-border/40">
                        <AvatarImage src={m.user.avatarUrl || ""} />
                        <AvatarFallback className="bg-muted text-xs font-bold">
                          {m.user.displayName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-foreground hover:underline">
                            {m.user.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground">@{m.user.username}</span>
                        </div>
                        {m.user.headline && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{m.user.headline}</p>
                        )}
                      </div>
                    </Link>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">
                      {m.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === "rules" ? (
            /* Rules & Bylaws View */
            <div className="rounded-2xl border border-border/30 bg-card/40 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-500" />
                <h3 className="text-base font-bold text-foreground">c/{community.name} Code of Conduct</h3>
              </div>
              {parsedRules.length === 0 ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Standard CampusLoop verified campus conduct applies. Be respectful, no harassment, and support fellow
                  classmates.
                </p>
              ) : (
                <div className="space-y-3">
                  {parsedRules.map((rule, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-border/30 bg-muted/20 space-y-1">
                      <p className="text-xs font-black text-foreground">
                        {idx + 1}. {rule.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Discussions Feed Tab */
            <div className="space-y-4">
              {/* Clean Quick Composer (NO harsh green outline, beautifully integrated) */}
              {isMember ? (
                <form
                  onSubmit={handleQuickPost}
                  className="rounded-2xl border border-border/40 bg-card/60 p-4 transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 shadow-xs"
                >
                  <div className="flex gap-3">
                    <Avatar className="size-9 rounded-full border border-border/40 shrink-0 mt-0.5">
                      <AvatarImage src={profile?.avatarUrl || ""} />
                      <AvatarFallback className="bg-muted text-xs font-bold">
                        {profile?.displayName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex flex-col gap-2">
                      <textarea
                        rows={quickText ? 2 : 1}
                        placeholder={`Post to c/${community.name}...`}
                        value={quickText}
                        onChange={(e) => setQuickText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleQuickPost(e);
                          }
                        }}
                        className="w-full bg-transparent text-[14px] placeholder:text-muted-foreground/60 font-normal outline-none focus:outline-none focus-visible:outline-none focus:ring-0 resize-none pt-1 border-0 shadow-none leading-relaxed"
                      />

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                        {/* Rich composer tools shortcut */}
                        <div className="flex items-center gap-1">
                          {[
                            {
                              id: "photo",
                              label: "Add photo",
                              icon: ImageIcon,
                              color: "text-emerald-500 hover:bg-emerald-500/10",
                            },
                            {
                              id: "gif",
                              label: "Add GIF",
                              icon: Smile,
                              color: "text-primary hover:bg-primary/10",
                            },
                            {
                              id: "poll",
                              label: "Create poll",
                              icon: BarChart3,
                              color: "text-blue-500 hover:bg-blue-500/10",
                            },
                            {
                              id: "anon",
                              label: "Post anonymously",
                              icon: VenetianMask,
                              color: "text-violet-500 hover:bg-violet-500/10",
                            },
                          ].map((tool) => (
                            <button
                              key={tool.id}
                              type="button"
                              title={tool.label}
                              aria-label={tool.label}
                              onClick={() => setShowFullComposer(true)}
                              className={cn(
                                "flex size-7 items-center justify-center rounded-full transition-all cursor-pointer active:scale-90",
                                tool.color
                              )}
                            >
                              <tool.icon className="size-4" />
                            </button>
                          ))}
                        </div>

                        <button
                          type="submit"
                          disabled={isQuickPosting || !quickText.trim()}
                          className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isQuickPosting ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="rounded-2xl border border-border/40 p-4 bg-card/40 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Join c/{community.name} to participate</p>
                    <p className="text-[11px] text-muted-foreground">
                      Post discussions, ask questions, vote on polls, and chat with members.
                    </p>
                  </div>
                  <JoinCommunityButton
                    communityId={community.id}
                    initialIsMember={false}
                    className="h-8 px-4 text-xs font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                    onMembershipChange={(joined) => {
                      setIsMember(joined);
                      setMembersCount((c) => Math.max(joined ? c + 1 : c - 1, 0));
                    }}
                  />
                </div>
              )}

              {/* Feed Stream */}
              {filteredPosts.length === 0 ? (
                /* Rich Empty State Card */
                <div className="rounded-3xl border border-border/30 bg-card/30 p-12 text-center space-y-4">
                  <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-inner">
                    <MessageSquarePlus className="size-7" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-base font-black text-foreground">
                      No discussions in c/{community.name} yet
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Be the pioneer! Start the first conversation, ask a campus question, or share resources with
                      fellow classmates.
                    </p>
                  </div>
                  {isMember && (
                    <button
                      type="button"
                      onClick={() => setShowFullComposer(true)}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus className="size-3.5" />
                      <span>Start First Discussion</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPosts.map((post) => (
                    <FeedCard key={post.id} post={post} currentUserId={profile?.id} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Desktop Community Sidebar (4 cols - PC space utilization) ─── */}
        <aside className="hidden lg:flex lg:col-span-4 flex-col gap-4 sticky top-20">
          {/* About Hub Card */}
          <div className="rounded-2xl border border-border/30 bg-card/40 p-4 space-y-3 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              About c/{community.name}
            </h3>
            {community.description && (
              <p className="text-xs text-foreground/80 leading-relaxed font-normal">
                {community.description}
              </p>
            )}
            <div className="divide-y divide-border/20 text-xs pt-1">
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-semibold text-foreground">
                  {new Date(community.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-bold text-foreground">{membersCount}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Discussions</span>
                <span className="font-bold text-foreground">{posts.length}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Privacy</span>
                <span className="font-semibold text-foreground capitalize">
                  {community.privacy?.toLowerCase() || "public"}
                </span>
              </div>
            </div>
          </div>

          {/* Moderator Info Card */}
          {community.creator && (
            <div className="rounded-2xl border border-border/30 bg-card/40 p-4 space-y-3 shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Community Moderator
              </h3>
              <Link
                href={`/@${community.creator.username}`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors"
              >
                <Avatar className="size-10 rounded-full border border-border/40">
                  <AvatarImage src={community.creator.avatarUrl || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {community.creator.displayName[0]?.toUpperCase() || "M"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">
                    {community.creator.displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    @{community.creator.username}
                  </p>
                </div>
              </Link>
            </div>
          )}

          {/* Related Communities Suggestion */}
          {relatedCommunities.length > 0 && (
            <div className="rounded-2xl border border-border/30 bg-card/40 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Explore More Hubs
                </h3>
                <Link href="/communities" className="text-[11px] text-primary font-bold hover:underline">
                  All Hubs
                </Link>
              </div>
              <div className="space-y-2">
                {relatedCommunities.slice(0, 3).map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/communities/${rel.slug || rel.id}`}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    <Avatar className="size-8 rounded-xl border border-border/30 shrink-0">
                      <AvatarImage src={rel.avatarUrl || ""} />
                      <AvatarFallback className="bg-muted text-[10px] font-bold">
                        {rel.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">c/{rel.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {rel.membersCount} members
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ─── Full Composer Modal ─── */}
      {showFullComposer && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-0 backdrop-blur-sm sm:p-6"
          onClick={() => setShowFullComposer(false)}
        >
          <div className="w-full max-w-2xl sm:my-4" onClick={(e) => e.stopPropagation()}>
            <PostComposer
              variant="modal"
              communityId={community.id}
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
