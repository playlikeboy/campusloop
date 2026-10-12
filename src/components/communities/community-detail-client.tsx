"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  Check,
  Clock,
  Code2,
  Coffee,
  Flame,
  Gamepad2,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  Lock,
  MessageSquare,
  MessageSquarePlus,
  Music,
  Plus,
  Rocket,
  Settings,
  Copy,
  ShieldCheck,
  Trophy,
  UploadCloud,
  Users,
  VenetianMask,
  Zap,
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
import { CommunityRoleBadge } from "@/components/communities/community-role-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeedCard } from "@/components/ui/feed-card";
import type { FeedPost } from "@/hooks/use-feed";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl } from "@/lib/utils";

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
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showFullComposer, setShowFullComposer] = useState(false);

  const identifier = community.slug || community.id;
  const isAcademicsHub =
    community.category === "Academics & Placements" ||
    identifier.includes("notes") ||
    identifier.includes("pyq") ||
    identifier.includes("acad");

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

  async function handleShareInvite() {
    sounds.tap();
    haptics.light();
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/communities/${identifier}`
        : `https://campusloop.space/communities/${identifier}`;

    const text = `Join c/${community.name} on CampusLoop!\n${community.description || "Verified student community"}\n\n${url}`;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedInvite(true);
      toast.success("Community invite link copied! +10 LP awarded");
      setTimeout(() => setCopiedInvite(false), 2500);
      recordCommunityInviteShare(community.id).catch(() => {});
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

  const avatar = getAvatarUrl(community.avatarUrl, community.name);

  // Category Icon Resolver
  const CategoryIcon = (() => {
    switch (community.category) {
      case "Tech & Coding":
        return Code2;
      case "Academics & Placements":
        return GraduationCap;
      case "Gaming & Anime":
        return Gamepad2;
      case "Music & Arts":
        return Music;
      case "Career & Startups":
        return Rocket;
      case "Sports & Fitness":
        return Trophy;
      case "Campus Services":
        return Building2;
      default:
        return Coffee;
    }
  })();

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6 pb-32 sm:pb-24">
      {/* ─── Breadcrumb & Top Navigation Bar ─── */}
      <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-3 px-1 pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Link
            href="/communities"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors group cursor-pointer"
          >
            <div className="size-6 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-muted transition-colors">
              <ArrowLeft className="size-3 text-foreground" />
            </div>
            <span>Communities</span>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-foreground font-bold truncate max-w-[200px] sm:max-w-md">
            c/{community.name}
          </span>
        </div>

        {/* Top Action Pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleShareInvite}
            aria-label={copiedInvite ? "Invite link copied" : "Copy community invite link"}
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border/60 bg-card px-0 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition cursor-pointer shadow-2xs sm:px-3"
            title="Copy community invite link"
          >
            {copiedInvite ? (
              <>
                <Check className="size-3 text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span className="hidden sm:inline">Copy invite</span>
              </>
            )}
          </button>

          <ShareQrButton
            title={`c/${community.name}`}
            subtitle={community.description || "Campus sub-hub on CampusLoop"}
            badgeText="Campus Community"
            shortUrl={`https://campusloop.space/communities/${identifier}`}
            avatarUrl={community.avatarUrl}
            category="community"
            className="size-8 border-border/60 bg-card text-muted-foreground hover:text-foreground shadow-2xs"
          />

          {isAdmin && (
            <Link
              href={`/communities/${identifier}/settings`}
              className="flex size-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground hover:text-foreground transition shadow-2xs"
              title="Community Settings"
            >
              <Settings className="size-3.5" />
            </Link>
          )}
        </div>
      </nav>

      {/* ─── Panoramic Cover Banner Header ─── */}
      <section className="relative rounded-3xl overflow-hidden border border-border/60 bg-muted/30 shadow-2xs">
        <div className="relative h-44 sm:h-56 lg:h-64 w-full overflow-hidden bg-muted">
          {community.bannerUrl ? (
            <>
              <img
                src={community.bannerUrl}
                alt={`${community.name} Banner`}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/15 via-muted/40 to-secondary/15 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
              <span className="text-5xl sm:text-7xl font-black text-muted-foreground/15 uppercase tracking-widest select-none">
                {community.name.slice(0, 3)}
              </span>
            </div>
          )}

          {/* Top Banner Tag */}
          <div className="absolute top-3.5 left-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-background/90 text-foreground backdrop-blur-md shadow-2xs border border-border/40">
              <CategoryIcon className="size-3" />
              {community.category || "General"}
            </span>
            {community.privacy === "PRIVATE" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                <Lock className="size-3" /> Private Hub
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-background/80 text-foreground backdrop-blur-xs border border-border/40">
                <Globe className="size-3 text-muted-foreground" /> Public
              </span>
            )}
          </div>
        </div>

        {/* ─── Community Plinth Card (Overlapping Profile) ─── */}
        <div className="px-5 pb-6 sm:px-8 sm:pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
            {/* Avatar & Title Block */}
            <div className="flex min-w-0 items-start gap-3 sm:items-end sm:gap-4">
              <Avatar className="size-20 sm:size-24 rounded-2xl ring-4 ring-card bg-card shadow-sm shrink-0">
                <AvatarImage src={avatar} alt="" className="object-cover" />
                <AvatarFallback className="text-xl sm:text-2xl font-black bg-primary/10 text-primary">
                  {community.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-1 pb-1">
                <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                  <h1 className="min-w-0 max-w-full text-lg sm:text-2xl lg:text-3xl font-black leading-tight tracking-tight text-foreground line-clamp-2 sm:line-clamp-none [overflow-wrap:anywhere]">
                    c/{community.name}
                  </h1>
                  {community.points && community.points > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/15 text-primary border border-primary/25 shrink-0">
                      <Zap className="size-3 fill-current" />
                      {community.points.toLocaleString()} LP Clout
                    </span>
                  ) : null}
                </div>

                {community.creator && (
                  <p className="break-words text-xs leading-snug text-muted-foreground">
                    Moderated by{" "}
                    <Link
                      href={`/@${community.creator.username}`}
                      className="font-bold text-foreground hover:text-primary transition-colors"
                    >
                      @{community.creator.username}
                    </Link>
                  </p>
                )}
              </div>
            </div>

            {/* Header Primary Action Buttons */}
            <div className="flex shrink-0 items-center gap-2 pt-0">
              <button
                type="button"
                onClick={handleOpenCommunityChat}
                disabled={isOpeningChat}
                className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-full border border-border/80 bg-card px-4 text-xs font-bold text-foreground hover:bg-muted transition-all active:scale-95 cursor-pointer shadow-2xs"
                title={`Open c/${community.name} chat room`}
              >
                {isOpeningChat ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="size-3.5 text-primary" />
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
                className="h-9 sm:h-10 px-5 text-xs font-bold"
              />
            </div>
          </div>

          {/* Description */}
          {community.description && (
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {community.description}
            </p>
          )}

          {/* Social Proof & Fast Metrics */}
          <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className="flex items-center gap-1.5 hover:text-foreground transition cursor-pointer"
            >
              <Users className="size-3.5 text-primary" />
              <span className="font-bold text-foreground">{membersCount}</span>
              <span>{membersCount === 1 ? "student" : "students"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("discussions")}
              className="flex items-center gap-1.5 hover:text-foreground transition cursor-pointer"
            >
              <MessageSquare className="size-3.5 text-sky-500" />
              <span className="font-bold text-foreground">{posts.length}</span>
              <span>{posts.length === 1 ? "discussion" : "discussions"}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>Verified Campus Community</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Academic Vault Domain Callout (Only for Notes / Academics Hub) ─── */}
      {isAcademicsHub && (
        <section className="relative rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-background p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="size-3.5" />
                </span>
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  Official Academic Vault &amp; PYQs Integration
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Access 45K+ semester handwritten notes, university solved question papers, and lab manuals
                curated for your syllabus.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/academics"
                className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-90 transition active:scale-95"
              >
                <span>Browse Notes</span>
                <ArrowRight className="size-3" />
              </Link>
              <Link
                href="/academics/upload"
                className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <UploadCloud className="size-3" />
                <span>Upload</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Workspace Layout: 8 cols stream + 4 cols sidebar on desktop ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* ─── Main Column (8 cols) ─── */}
        <div className="space-y-4 lg:col-span-8">
          {/* Section Navigation Tabs & Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-2">
            <div className="flex w-full min-w-0 items-center gap-0.5 overflow-x-auto scrollbar-none rounded-full bg-muted/50 p-1 border border-border/40 sm:w-auto sm:shrink-0">
              {[
                { key: "discussions", label: `Discussions (${posts.length})`, icon: MessageSquare },
                { key: "members", label: `Members (${membersCount})`, icon: Users },
                { key: "rules", label: "Rules & Guidelines", icon: ShieldCheck },
              ].map((tab) => {
                const isSelected = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                      setActiveTab(tab.key as typeof activeTab);
                    }}
                    className={cn(
                      "flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 sm:px-4 text-[11px] sm:text-xs font-semibold transition cursor-pointer",
                      isSelected
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter Pills for Discussions */}
            {activeTab === "discussions" && (
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
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
                      onClick={() => {
                        sounds.tap();
                        haptics.light();
                        setFeedFilter(f.key as typeof feedFilter);
                      }}
                      className={cn(
                        "flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer",
                        active
                          ? "bg-foreground text-background shadow-2xs font-extrabold"
                          : "text-muted-foreground hover:text-foreground bg-muted/40"
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

          {/* ─── TAB: DISCUSSIONS ─── */}
          {activeTab === "discussions" && (
            <div className="space-y-4">
              {/* Sleek Interactive Post Prompt */}
              {isMember ? (
                <div
                  onClick={() => setShowFullComposer(true)}
                  className="rounded-2xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-2xs transition-all hover:border-primary/40 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 rounded-full ring-2 ring-card bg-muted shrink-0">
                      <AvatarImage src={profile?.avatarUrl || ""} />
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {(profile?.displayName || "U").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 bg-muted/50 rounded-xl px-4 py-2 text-xs sm:text-sm text-muted-foreground group-hover:bg-muted/70 transition">
                      Start a discussion or ask a question in c/{community.name}...
                    </div>

                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground shadow-xs shrink-0"
                    >
                      <Plus className="size-3.5" />
                      <span className="hidden sm:inline">Post</span>
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1 hover:text-foreground transition">
                        <ImageIcon className="size-3.5 text-emerald-500" /> Photo
                      </span>
                      <span className="inline-flex items-center gap-1 hover:text-foreground transition">
                        <BarChart3 className="size-3.5 text-sky-500" /> Poll
                      </span>
                      <span className="inline-flex items-center gap-1 hover:text-foreground transition">
                        <VenetianMask className="size-3.5 text-violet-500" /> Anonymous
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
                      Markdown &amp; LaTeX supported
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">
                      Join c/{community.name} to participate in discussions
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Ask questions, post study notes, vote on polls, and chat with members.
                    </p>
                  </div>
                  <JoinCommunityButton
                    communityId={community.id}
                    initialIsMember={false}
                    className="h-8 px-4 text-xs font-bold shrink-0"
                    onMembershipChange={(joined) => {
                      setIsMember(joined);
                      setMembersCount((c) => Math.max(joined ? c + 1 : c - 1, 0));
                    }}
                  />
                </div>
              )}

              {/* Feed Stream */}
              {filteredPosts.length > 0 ? (
                <div className="space-y-3">
                  {filteredPosts.map((post) => (
                    <FeedCard key={post.id} post={post} currentUserId={profile?.id} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-card p-12 text-center space-y-4 shadow-2xs">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <MessageSquarePlus className="size-6" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-base font-bold text-foreground">
                      No discussions in c/{community.name} yet
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Be the first student to start a discussion, share study resources, or ask a question.
                    </p>
                  </div>
                  {isMember && (
                    <button
                      type="button"
                      onClick={() => setShowFullComposer(true)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs active:scale-95 transition hover:opacity-90 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Start First Discussion</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: MEMBERS ─── */}
          {activeTab === "members" && (
            <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden shadow-2xs">
              {membersList.length > 0 ? (
                membersList.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition"
                  >
                    <Link href={`/@${m.user.username}`} className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-10 rounded-full border border-border/40 shrink-0">
                        <AvatarImage src={m.user.avatarUrl || ""} />
                        <AvatarFallback className="bg-muted text-xs font-bold">
                          {(m.user.displayName || "U").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-foreground truncate hover:underline">
                            {m.user.displayName}
                          </p>
                          <span className="text-[11px] text-muted-foreground truncate">
                            @{m.user.username}
                          </span>
                        </div>
                        {m.user.headline && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                            {m.user.headline}
                          </p>
                        )}
                      </div>
                    </Link>

                    <CommunityRoleBadge role={m.role} />
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No public member list available for this hub yet.
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: RULES ─── */}
          {activeTab === "rules" && (
            <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-500" />
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  c/{community.name} Code of Conduct
                </h3>
              </div>

              {parsedRules.length > 0 ? (
                <div className="space-y-3">
                  {parsedRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-1"
                    >
                      <p className="text-xs font-bold text-foreground">
                        {idx + 1}. {rule.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {rule.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Standard CampusLoop verified campus conduct applies: be respectful to fellow students,
                  no harassment, maintain constructive discussions, and help freshers learn.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ─── Sidebar Column (4 cols on desktop) ─── */}
        <aside className="space-y-4 lg:col-span-4">
          {/* About Hub Card */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              About This Hub
            </h3>
            {community.description && (
              <p className="text-xs text-foreground/80 leading-relaxed font-normal">
                {community.description}
              </p>
            )}

            <div className="divide-y divide-border/30 text-xs pt-1">
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-bold text-foreground">{community.category || "General"}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Founded</span>
                <span className="font-semibold text-foreground">
                  {new Date(community.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Total Members</span>
                <span className="font-bold text-foreground">{membersCount}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Discussions</span>
                <span className="font-bold text-foreground">{posts.length}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Access</span>
                <span className="font-semibold text-foreground capitalize">
                  {community.privacy?.toLowerCase() || "public"}
                </span>
              </div>
            </div>
          </div>

          {/* Moderator Info Card */}
          {community.creator && (
            <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Community Moderator
              </h3>
              <Link
                href={`/@${community.creator.username}`}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/60 transition group"
              >
                <Avatar className="size-10 rounded-full border border-border/40 shrink-0">
                  <AvatarImage src={community.creator.avatarUrl || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {(community.creator.displayName || "M").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {community.creator.displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    @{community.creator.username}
                  </p>
                </div>

                <CommunityRoleBadge role="ADMIN" />
              </Link>
            </div>
          )}

          {/* Related Communities Suggestion */}
          {relatedCommunities.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Explore Related Hubs
                </h3>
                <Link
                  href="/communities"
                  className="text-[11px] text-primary font-bold hover:underline"
                >
                  All Hubs
                </Link>
              </div>

              <div className="space-y-2">
                {relatedCommunities.slice(0, 3).map((rel) => {
                  const relAvatar = getAvatarUrl(rel.avatarUrl, rel.name);
                  return (
                    <Link
                      key={rel.id}
                      href={`/communities/${rel.slug || rel.id}`}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/40 transition group"
                    >
                      <Avatar className="size-8 rounded-xl border border-border/40 shrink-0">
                        <AvatarImage src={relAvatar} />
                        <AvatarFallback className="bg-muted text-[10px] font-bold">
                          {rel.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          c/{rel.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {rel.membersCount} {rel.membersCount === 1 ? "member" : "members"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
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
