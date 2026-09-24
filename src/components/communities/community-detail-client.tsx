"use client";

import {
  ArrowLeft,
  ChevronRight,
  Globe,
  Info,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { recordCommunityInviteShare } from "@/app/app/(main)/communities/actions";
import { JoinCommunityButton } from "@/app/app/(main)/communities/join-community-button";
import { CommunityPostStream } from "@/components/communities/community-post-stream";
import { ShareQrButton } from "@/components/common/share-qr-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl } from "@/lib/utils";

export interface CommunityDetailProps {
  community: {
    id: string;
    slug: string | null;
    name: string;
    description: string | null;
    category: string;
    privacy: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    points: number;
    rules: string | null;
    allowAnonymousPosts: boolean;
    creatorId: string;
    createdAt: Date;
    memberCount: number;
    postCount: number;
    creator: {
      id: string;
      username: string;
      displayName: string;
    };
  };
  initialMembersCount: number;
  initialIsMember: boolean;
  isAdmin: boolean;
  relatedCommunities?: Array<{
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    category: string;
    avatarUrl: string | null;
    membersCount: number;
    isMember?: boolean;
  }>;
}

type Tab = "posts" | "qna" | "about";

function getGradient(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("tech")) return "from-cyan-500/30 via-primary/20 to-transparent";
  if (normalized.includes("gaming")) return "from-violet-500/30 via-primary/20 to-transparent";
  if (normalized.includes("academic")) return "from-blue-500/25 via-primary/15 to-transparent";
  if (normalized.includes("cultural")) return "from-rose-500/25 via-primary/15 to-transparent";
  return "from-primary/25 via-primary/10 to-transparent";
}

export function CommunityDetailClient({
  community,
  initialMembersCount,
  initialIsMember,
  isAdmin,
  relatedCommunities = [],
}: CommunityDetailProps) {
  const router = useRouter();
  const { profile } = useProfile();
  const [tab, setTab] = useState<Tab>("posts");
  const [isMember, setIsMember] = useState(initialIsMember);
  const [membersCount, setMembersCount] = useState(initialMembersCount);
  const [sharing, setSharing] = useState(false);

  const identifier = community.slug || community.id;

  const rules = useMemo(() => {
    if (!community.rules) return [];
    try {
      const parsed = JSON.parse(community.rules);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [community.rules]);

  async function openChat() {
    try {
      sounds.tap();
      haptics.light();
      const response = await fetch("/api/communities/" + community.id + "/chat", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Could not open community chat");
      const data = (await response.json()) as { conversationId: string };
      router.push("/app/chat/" + data.conversationId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open community chat");
    }
  }

  async function shareCommunity() {
    const url =
      typeof window !== "undefined"
        ? window.location.origin + "/app/communities/" + identifier
        : "https://campusloop.space/app/communities/" + identifier;

    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "c/" + community.name,
          text: community.description || "Campus community on CampusLoop",
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Community link copied");
      }
      recordCommunityInviteShare(community.id).catch(() => {});
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast.error("Could not share this community");
      }
    } finally {
      setSharing(false);
    }
  }

  function updateMembership(next: boolean) {
    setIsMember(next);
    setMembersCount((count) => Math.max(0, count + (next ? 1 : -1)));
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl border-x border-border/20 bg-background pb-[calc(6rem+env(safe-area-inset-bottom))] text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/20 bg-background/92 backdrop-blur-xl">
        <div className="flex min-h-12 items-center gap-2 px-3 sm:px-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            <ArrowLeft className="size-4.5" />
          </button>

          <Avatar className="size-7 shrink-0 rounded-full ring-1 ring-border/50">
            <AvatarImage src={getAvatarUrl(community.avatarUrl, community.name)} alt="" />
            <AvatarFallback className="bg-muted text-[10px] font-black">
              {community.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">c/{community.name}</p>
            <p className="truncate text-[10px] font-medium text-muted-foreground">
              {membersCount} members · {community.postCount} discussions
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={openChat}
              aria-label="Open community chat"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <MessageCircle className="size-4" />
            </button>

            <button
              type="button"
              onClick={shareCommunity}
              disabled={sharing}
              aria-label="Share community"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
            >
              <Share2 className="size-4" />
            </button>

            <ShareQrButton
              title={"c/" + community.name}
              subtitle={community.description || "Campus community on CampusLoop"}
              badgeText="Campus community"
              shortUrl={"https://campusloop.space/c/" + (community.slug || community.id)}
              avatarUrl={community.avatarUrl}
              category="community"
              className="size-9 border-0 bg-transparent text-muted-foreground hover:bg-muted/60"
            />

            {isAdmin ? (
              <Link
                href={"/app/communities/" + identifier + "/settings"}
                aria-label="Community settings"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                <MoreHorizontal className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <section>
        {community.bannerUrl ? (
          <div className="relative h-24 overflow-hidden sm:h-32">
            <img
              src={community.bannerUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background/35 to-transparent" />
          </div>
        ) : (
          <div
            className={cn(
              "h-20 bg-linear-to-r sm:h-28",
              getGradient(community.category)
            )}
          />
        )}

        <div className="relative px-4 sm:px-5">
          <div className="flex items-end justify-between gap-3">
            <Avatar className="-mt-9 size-20 shrink-0 rounded-full border-4 border-background bg-card shadow-sm sm:-mt-10 sm:size-22">
              <AvatarImage
                src={getAvatarUrl(community.avatarUrl, community.name)}
                alt={community.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-muted text-xl font-black">
                {community.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex items-center gap-1.5 pb-1">
              <JoinCommunityButton
                communityId={community.id}
                initialIsMember={isMember}
                onMembershipChange={updateMembership}
                className="h-9 px-4 text-xs font-black"
              />
            </div>
          </div>

          <div className="pt-3">
            <div className="flex items-center gap-2">
              <h1 className="min-w-0 text-xl font-black tracking-tight sm:text-2xl">{community.name}</h1>
              <ShieldCheck className="size-4 shrink-0 text-primary" aria-label="Verified community" />
            </div>

            <p className="mt-0.5 text-xs font-bold text-primary">{community.category}</p>

            {community.description ? (
              <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/90">
                {community.description}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
              <Link href={"/app/communities/" + identifier + "/members"} className="font-bold hover:text-foreground">
                <Users className="mr-1 inline size-3.5" />
                {membersCount} members
              </Link>
              <span>
                <MessageCircle className="mr-1 inline size-3.5" />
                {community.postCount} discussions
              </span>
              <span>
                <Sparkles className="mr-1 inline size-3.5" />
                {community.points || 0} LP
              </span>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Community sections" className="mt-4 flex border-b border-border/20 px-2">
        {[
          { id: "posts" as const, label: "Posts" },
          { id: "qna" as const, label: "Q&A" },
          { id: "about" as const, label: "About" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "relative min-h-11 flex-1 px-3 text-xs font-bold transition-colors",
              tab === item.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
            {tab === item.id ? (
              <span className="absolute inset-x-7 bottom-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        ))}
      </nav>

      {tab === "posts" || tab === "qna" ? (
        <section>
          <div className="border-b border-border/20 px-4 py-3 sm:px-5">
            {isMember ? (
              <Link
                href={
                  "/app/post/new?communityId=" +
                  encodeURIComponent(community.id)
                }
                className="group flex items-center gap-3 rounded-2xl bg-muted/30 px-3.5 py-3 transition-colors hover:bg-muted/50"
              >
                <Avatar className="size-9 rounded-full">
                  <AvatarImage src={profile?.avatarUrl || ""} alt="" />
                  <AvatarFallback className="bg-background text-xs font-black">
                    {profile?.displayName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black group-hover:text-primary">
                    Start a discussion
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    Ask something, share resources, run a poll, or post anonymously.
                  </p>
                </div>
                <Pencil className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-muted/30 px-3.5 py-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-background text-muted-foreground">
                  <Lock className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black">Join to participate</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Join this hub before starting a discussion.
                  </p>
                </div>
                <JoinCommunityButton
                  communityId={community.id}
                  initialIsMember={false}
                  onMembershipChange={updateMembership}
                  className="h-8 px-3 text-[11px]"
                />
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                <span className="rounded-full bg-muted px-2.5 py-1 text-foreground">Latest</span>
                <span className="px-2 py-1">Relevant follows community activity first.</span>
              </div>
              <Info className="size-3.5 text-muted-foreground" />
            </div>
          </div>

          <CommunityPostStream
            profileId={profile?.id || ""}
            tab="discussions"
            communityId={community.id}
            kind={tab === "qna" ? "qna" : "all"}
            emptyTitle={tab === "qna" ? "No Q&A yet" : "No posts yet"}
            emptyDescription={
              tab === "qna"
                ? "Questions and polls posted in this hub will collect here."
                : "Start the first useful conversation in this community."
            }
          />
        </section>
      ) : (
        <section className="space-y-4 px-4 py-5 sm:px-5">
          <div className="rounded-2xl bg-muted/25 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <h2 className="text-sm font-black">About this hub</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {community.description || "A student-run community on CampusLoop."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatCard value={String(membersCount)} label="Members" />
            <StatCard value={String(community.postCount)} label="Discussions" />
            <StatCard value={String(community.points || 0)} label="LP" />
          </div>

          <div className="rounded-2xl bg-muted/25 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black">Community details</h2>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {community.privacy === "PRIVATE" ? "Private" : "Public"} · Created by @{community.creator?.username}
                </p>
              </div>
              <ShieldCheck className="size-4 text-primary" />
            </div>

            <div className="mt-4 space-y-3">
              <Link
                href={"/app/communities/" + identifier + "/members"}
                className="flex items-center justify-between rounded-xl bg-background px-3 py-2.5 text-xs font-bold ring-1 ring-border/30"
              >
                <span>View members and moderators</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
              {isAdmin ? (
                <Link
                  href={"/app/communities/" + identifier + "/settings"}
                  className="flex items-center justify-between rounded-xl bg-background px-3 py-2.5 text-xs font-bold ring-1 ring-border/30"
                >
                  <span>Manage community</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl bg-muted/25 p-4">
            <h2 className="text-sm font-black">Guidelines</h2>
            {rules.length ? (
              <div className="mt-3 space-y-2">
                {rules.map((rule: { title?: string; description?: string }, index) => (
                  <div key={index} className="rounded-xl bg-background px-3 py-2.5 ring-1 ring-border/25">
                    <p className="text-xs font-bold">
                      {index + 1}. {rule.title || "Community rule"}
                    </p>
                    {rule.description ? (
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        {rule.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                No custom rules have been added. Standard CampusLoop community guidelines apply.
              </p>
            )}
          </div>

          {relatedCommunities.length ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black">Related hubs</h2>
                  <p className="text-[11px] text-muted-foreground">Other active communities you can join.</p>
                </div>
                <Link href="/app/communities" className="text-[11px] font-bold text-primary">
                  Explore
                </Link>
              </div>

              <div className="divide-y divide-border/20">
                {relatedCommunities.map((related) => (
                  <Link
                    key={related.id}
                    href={"/app/communities/" + (related.slug || related.id)}
                    className="flex items-center gap-3 py-3"
                  >
                    <Avatar className="size-10 rounded-full ring-1 ring-border/40">
                      <AvatarImage src={getAvatarUrl(related.avatarUrl, related.name)} alt="" />
                      <AvatarFallback className="bg-muted text-xs font-black">
                        {related.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black">c/{related.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {related.category} · {related.membersCount} members
                      </p>
                    </div>
                    {related.isMember ? (
                      <span className="text-[10px] font-bold text-primary">Joined</span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={shareCommunity}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-black text-background transition-opacity hover:opacity-90"
          >
            <Share2 className="size-3.5" />
            Share this community
          </button>
        </section>
      )}
    </main>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-muted/25 px-3 py-3 text-center">
      <p className="text-sm font-black">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold text-muted-foreground">{label}</p>
    </div>
  );
}
