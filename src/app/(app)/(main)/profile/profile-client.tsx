"use client";

import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Calendar,
  Camera,
  ChevronRight,
  Crown,
  Edit3,
  Eye,
  Flame,
  FolderPlus,
  GraduationCap,
  Landmark,
  Layers,
  Loader2,
  MapPin,
  MessageSquare,
  MoreVertical,
  Move,
  PenTool,
  Plus,
  QrCode,
  Share2,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { archivePost, deletePost } from "@/app/(app)/(main)/post/actions";
import { AcademicPlaylistCard } from "@/components/academics/academic-playlist-card";
import { ArticleCard } from "@/components/articles/article-card";
import { AcademicCard } from "@/components/communities/academic-card";
import { SecretCrushButton } from "@/components/dating/secret-crush-button";
import { FollowButton } from "@/components/profile/follow-button";
import { ProfileHighlights } from "@/components/profile/profile-highlights";
import { ProfileSocialLinks } from "@/components/profile/profile-social-links";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeedCard } from "@/components/ui/feed-card";
import { getBranchIcon, slugifyBranch } from "@/constants";

const BrandedQrModal = dynamic(
  () => import("@/components/common/branded-qr-modal").then((m) => m.BrandedQrModal),
  { ssr: false }
);
const UnsplashImagePicker = dynamic(
  () => import("@/components/common/unsplash-image-picker").then((m) => m.UnsplashImagePicker),
  { ssr: false }
);
const ImageCropModal = dynamic(
  () => import("@/components/ui/image-crop-modal").then((m) => m.ImageCropModal),
  { ssr: false }
);

import type { FeedPost } from "@/hooks/use-feed";
import { fetcher } from "@/lib/api";
import { getCloutTier } from "@/lib/gamification";
import { cn } from "@/lib/utils";

interface ProfileClientViewProps {
  profile: {
    id: string;
    username: string;
    displayName: string;
    officialName?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    headline?: string | null;
    bio?: string | null;
    gender?: string | null;
    dob?: string | null;
    isDobPrivate?: boolean | null;
    course?: string | null;
    branch?: string | null;
    year?: number | null;
    points?: number | null;
    role?: string | null;
    status?: string | null;
    anonymousUsername?: string | null;
    feedVisibility?: string | null;
    photos?: string[] | null;
    interests?: string[] | null;
    referralCount?: number | null;
    socialLinks?: {
      platforms?: Record<string, string>;
      custom?: { label: string; url: string }[];
    } | null;

    createdAt?: Date | string | null;
    institution?: {
      id: string;
      name: string;
      slug: string;
      state?: string | null;
      district?: string | null;
    } | null;
  };
  formattedPosts: FeedPost[];
  isOwnProfile: boolean;
  currentUserId?: string;
  followersCount?: number;
  followingCount?: number;
  friendsCount?: number;
  isFollowedByViewer?: boolean;
}

export function ProfileClientView({
  profile,
  formattedPosts: initialPosts,
  isOwnProfile,
  currentUserId,
  followersCount = 0,
  followingCount = 0,
  friendsCount = 0,
  isFollowedByViewer = false,
}: ProfileClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTabParam = searchParams?.get("tab");

  const [followers, setFollowers] = useState(followersCount);
  const [activeTab, setActiveTab] = useState<
    "posts" | "articles" | "academics" | "photos" | "clout" | "archived"
  >(
    initialTabParam === "academics" || initialTabParam === "notes"
      ? "academics"
      : initialTabParam === "articles"
        ? "articles"
        : initialTabParam === "photos" || initialTabParam === "gallery"
          ? "photos"
          : initialTabParam === "clout" || initialTabParam === "perks"
            ? "clout"
            : "posts"
  );
  const [archivedPosts, setArchivedPosts] = useState<FeedPost[]>([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showPhotoLightbox, setShowPhotoLightbox] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Sync tab with URL query parameter on navigation
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "academics" || tabParam === "notes") {
      setActiveTab("academics");
    } else if (tabParam === "articles") {
      setActiveTab("articles");
    } else if (tabParam === "photos" || tabParam === "gallery") {
      setActiveTab("photos");
    } else if (tabParam === "clout" || tabParam === "perks") {
      setActiveTab("clout");
    } else if (tabParam === "archived") {
      setActiveTab("archived");
    }
  }, [searchParams]);

  function handleTabChange(tab: "posts" | "articles" | "academics" | "photos" | "clout" | "archived") {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "posts") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      window.history.replaceState({}, "", url.toString());
    }
  }

  // Fetched unconditionally so the Articles tab shows a real count instead of
  // "(0)" until someone opens it. The payload excludes article bodies.
  const { data: userArticlesData, isLoading: isLoadingArticles } = useSWR<{ articles: any[] }>(
    `/api/articles/user/${profile.username}`,
    fetcher,
    { dedupingInterval: 60000 }
  );
  const userArticles = userArticlesData?.articles || [];

  // Fetch shared notes & study playlists
  const { data: userAcademicsData, isLoading: isLoadingAcademics } = useSWR<{
    resources: any[];
    playlists: any[];
    totalCount: number;
  }>(`/api/profile/${profile.username}/academics`, fetcher, { dedupingInterval: 30000 });
  const userResources = userAcademicsData?.resources || [];
  const userPlaylists = userAcademicsData?.playlists || [];
  const userAcademicsCount = userAcademicsData?.totalCount || 0;
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const pfpInputRef = useRef<HTMLInputElement | null>(null);

  // Crop Modal States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState("");
  const [cropMode, setCropMode] = useState<"avatar" | "banner">("avatar");
  const [showUnsplashBannerPicker, setShowUnsplashBannerPicker] = useState(false);
  const [optimisticBannerUrl, setOptimisticBannerUrl] = useState<string | null>(null);
  const [optimisticAvatarUrl, setOptimisticAvatarUrl] = useState<string | null>(null);

  const currentBannerUrl = optimisticBannerUrl ?? profile.bannerUrl;
  const currentAvatarUrl = optimisticAvatarUrl ?? profile.avatarUrl;

  const loadArchivedPosts = useCallback(async () => {
    if (!isOwnProfile) return;
    setIsLoadingArchived(true);
    try {
      const res = await fetch("/api/posts/archived");
      if (res.ok) {
        const data = (await res.json()) as FeedPost[];
        setArchivedPosts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingArchived(false);
    }
  }, [isOwnProfile]);

  useEffect(() => {
    if (activeTab === "archived") {
      loadArchivedPosts();
    }
  }, [activeTab, loadArchivedPosts]);

  async function handleRestorePost(postId: string) {
    try {
      await archivePost(postId);
      toast.success("Post restored to public feeds! 🚀");
      setArchivedPosts((prev) => prev.filter((p) => p.id !== postId));
      router.refresh();
    } catch {
      toast.error("Failed to restore post");
    }
  }

  async function handleDeleteArchivedPost(postId: string) {
    try {
      await deletePost(postId);
      toast.success("Post deleted permanently");
      setArchivedPosts((prev) => prev.filter((p) => p.id !== postId));
      router.refresh();
    } catch {
      toast.error("Failed to delete post");
    }
  }

  // ─── Infinite Scroll for Profile Posts ───
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
    setHasMore(initialPosts.length >= 20);
    setPage(1);
    setLoadMoreError(false);
  }, [initialPosts]);

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await fetch(`/api/feed?authorId=${profile.id}&page=${nextPage}&limit=20`);
      if (!res.ok) throw new Error("Failed to load more posts");
      const newPosts = (await res.json()) as FeedPost[];
      setLoadMoreError(false);

      if (newPosts.length === 0 || newPosts.length < 20) {
        setHasMore(false);
      }

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filtered = newPosts.filter((p) => !existingIds.has(p.id));
        return [...prev, ...filtered];
      });
      setPage(nextPage);
    } catch {
      // Keep pagination enabled so a transient network failure can be retried.
      setLoadMoreError(true);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, profile.id]);

  useEffect(() => {
    if (!sentinelNode || !hasMore || activeTab !== "posts") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loadMoreError) {
          loadMorePosts();
        }
      },
      { threshold: 0.2, rootMargin: "250px" }
    );

    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [sentinelNode, hasMore, isLoadingMore, loadMoreError, loadMorePosts, activeTab]);

  const points = profile.points || 0;
  const tier = getCloutTier(points);

  const candidatePhotos =
    profile.photos && profile.photos.length > 0
      ? profile.photos
      : profile.avatarUrl
        ? [profile.avatarUrl]
        : [];

  const branchSlug = profile.branch ? slugifyBranch(profile.branch) : null;
  const branchIcon = getBranchIcon(profile.branch || profile.course);

  const institutionName = profile.institution?.name || "";
  const campusShort = institutionName.split(",")[0];

  async function handleShareVibe() {
    const branchText = profile.branch ? `• Discipline: ${profile.branch}\n` : "";
    const campusText = campusShort ? `• Campus: ${campusShort}\n` : "";
    const shareText = `⚡️ Connect with @${profile.username} on CampusLoop:\n${campusText}${branchText}• Clout Rank: ${tier.tierName} (Level ${tier.level})\n• Loop Points: ${points} LP 🔥`;
    const profileUrl = `https://campusloop.space/@${profile.username}`;

    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${profile.displayName} on CampusLoop`,
          text: shareText,
          url: profileUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(`${shareText}\n\nView student profile: ${profileUrl}`);
      toast.success("Profile link & Vibe Card copied! Share on WhatsApp 🚀");
    } catch {
      toast.error("Could not copy the profile link. Please use your browser's share menu.");
    }
  }

  function handleBannerFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropImageUrl(reader.result);
        setCropMode("banner");
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  }

  function handlePfpFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropImageUrl(reader.result);
        setCropMode("avatar");
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    if (pfpInputRef.current) pfpInputRef.current.value = "";
  }

  async function handleCropCompleted(croppedUrl: string) {
    if (cropMode === "banner") {
      const prev = optimisticBannerUrl;
      setOptimisticBannerUrl(croppedUrl);
      try {
        const res = await fetch("/api/profile/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bannerUrl: croppedUrl }),
        });
        if (!res.ok) throw new Error("Failed to update cover banner");
        toast.success("Cover banner updated! 🎨");
        router.refresh();
      } catch (e) {
        setOptimisticBannerUrl(prev);
        toast.error("Failed to update cover banner");
        console.error(e);
      }
    } else {
      const prev = optimisticAvatarUrl;
      setOptimisticAvatarUrl(croppedUrl);
      try {
        const res = await fetch("/api/profile/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: croppedUrl }),
        });
        if (!res.ok) throw new Error("Failed to update profile photo");
        toast.success("Profile photo updated! 📸");
        router.refresh();
      } catch (e) {
        setOptimisticAvatarUrl(prev);
        toast.error("Failed to update profile photo");
        console.error(e);
      }
    }
  }

  async function handleSelectUnsplashBanner(photoUrl: string) {
    const prev = optimisticBannerUrl;
    setOptimisticBannerUrl(photoUrl);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerUrl: photoUrl }),
      });
      if (!res.ok) throw new Error("Failed to update cover banner");
      toast.success("Profile cover updated from Unsplash! 🎨");
      router.refresh();
    } catch (e) {
      setOptimisticBannerUrl(prev);
      toast.error("Failed to update profile cover");
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen pb-28 text-foreground select-none touch-manipulation">
      {/* Image Crop & Resize Modal */}
      {cropModalOpen && (
        <ImageCropModal
          isOpen={cropModalOpen}
          onClose={() => setCropModalOpen(false)}
          imageUrl={cropImageUrl}
          mode={cropMode}
          onCropComplete={handleCropCompleted}
        />
      )}

      {/* Hidden Banner File Input */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleBannerFileSelected}
      />

      {/* Hidden PFP File Input */}
      <input
        ref={pfpInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handlePfpFileSelected}
      />

      {/* ─── Sticky Minimal Top Header Bar (Twitter/X Style) ─── */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-13 px-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-6 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="size-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
              title="Back"
            >
              <ArrowLeft className="size-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-base font-bold text-foreground truncate tracking-tight">
                  {profile.displayName}
                </span>
                <BadgeCheck className="size-4 text-primary shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="size-8 sm:size-9 rounded-full border border-border/60 hover:bg-muted/60 text-foreground flex items-center justify-center transition-colors cursor-pointer"
              title="Profile QR Card"
            >
              <QrCode className="size-4" />
            </button>

            <button
              type="button"
              onClick={handleShareVibe}
              className="size-8 sm:size-9 rounded-full border border-border/60 hover:bg-muted/60 text-foreground flex items-center justify-center transition-colors cursor-pointer"
              title="Share Profile"
            >
              <Share2 className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowProfileMenu((value) => !value)}
              className="cl-interactive flex size-8 items-center justify-center rounded-full border border-border/60 text-foreground transition-colors hover:bg-muted/60 cursor-pointer"
              title="More profile actions"
              aria-label="More profile actions"
              aria-expanded={showProfileMenu}
            >
              <MoreVertical className="size-4" />
            </button>
          </div>
        </div>

        {showProfileMenu && (
          <>
            <button
              type="button"
              aria-label="Close profile actions"
              className="fixed inset-0 z-30 cursor-default bg-transparent"
              onClick={() => setShowProfileMenu(false)}
            />
            <div className="absolute right-3 top-11 z-40 w-48 rounded-xl border border-border/60 bg-popover p-1.5 text-popover-foreground shadow-xl">
              {isOwnProfile ? (
                <Link
                  href="/profile/edit"
                  onClick={() => setShowProfileMenu(false)}
                  className="cl-interactive flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold hover:bg-muted"
                >
                  <Edit3 className="size-4 text-primary" />
                  Edit profile
                </Link>
              ) : (
                <Link
                  href={`/chat?userId=${profile.id}`}
                  onClick={() => setShowProfileMenu(false)}
                  className="cl-interactive flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold hover:bg-muted"
                >
                  <MessageSquare className="size-4" />
                  Message
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  setShowProfileMenu(false);
                  await handleShareVibe();
                }}
                className="cl-interactive flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-muted"
              >
                <Share2 className="size-4" />
                Share profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowQrModal(true);
                }}
                className="cl-interactive flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-muted"
              >
                <QrCode className="size-4" />
                QR card
              </button>
            </div>
          </>
        )}
      </div>

      <main className="mx-auto min-h-screen w-full max-w-2xl border-x border-border/40">
        {/* ─── Profile Cover Banner (Clean Neutral Canvas) ─── */}
        <div className="relative h-32 sm:h-44 w-full bg-[#16181C] overflow-hidden border-b border-border/20">
          {currentBannerUrl ? (
            <img src={currentBannerUrl} alt="Cover Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-b from-neutral-800/40 via-[#16181C] to-[#121417] relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-700/10 via-transparent to-transparent" />
            </div>
          )}

          {/* Banner Edit / Camera Controls for Owner */}
          {isOwnProfile && (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={() => setShowUnsplashBannerPicker(true)}
                className="h-8 px-3 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer text-xs font-semibold border border-white/10"
                title="Choose Cover from Unsplash"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Unsplash</span>
              </button>

              {currentBannerUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setCropImageUrl(currentBannerUrl || "");
                    setCropMode("banner");
                    setCropModalOpen(true);
                  }}
                  className="size-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer border border-white/10"
                  title="Reposition Banner"
                >
                  <Move className="size-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="size-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer border border-white/10"
                title="Change Cover Banner"
              >
                <Camera className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ─── Profile Header Main Info (Twitter Architecture) ─── */}
        <div className="px-4 pb-4">
          {/* Avatar & Action Buttons Bar */}
          <div className="flex items-end justify-between -mt-14 sm:-mt-16 mb-3 relative z-10">
            {/* Clickable Circular Profile Picture with Online Status */}
            <div className="relative group">
              <div
                onClick={() => {
                  if (isOwnProfile) setShowAvatarMenu(true);
                }}
                className="relative size-24 sm:size-28 rounded-full border-4 border-background overflow-hidden bg-background cursor-pointer group-hover:opacity-95 transition-opacity shadow-lg"
              >
                <Avatar className="size-full">
                  <AvatarImage src={currentAvatarUrl || ""} className="object-cover size-full" />
                  <AvatarFallback className="text-2xl sm:text-3xl font-black bg-muted text-foreground">
                    {profile.displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="size-5 text-white" />
                  </div>
                )}
              </div>

              {/* Presence is rendered only where a real heartbeat-backed signal is available. */}
            </div>

            {/* Action Buttons: Edit Profile (Own) or Message/Follow (Viewer) */}
            <div className="flex items-center gap-2 pb-1 sm:pb-2">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="h-9 px-3.5 rounded-full border border-border/70 bg-card hover:bg-muted/60 text-xs font-bold text-foreground transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <QrCode className="size-3.5 text-muted-foreground" />
                    <span>QR Card</span>
                  </button>
                  <Link
                    href="/profile/edit"
                    className="h-9 px-4 rounded-full border border-border/80 hover:bg-muted/60 text-xs font-bold text-foreground transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Edit3 className="size-3.5 text-muted-foreground" />
                    <span>Edit profile</span>
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-2.5 shrink-0">
                  <FollowButton
                    username={profile.username}
                    displayName={profile.displayName}
                    initialIsFollowing={isFollowedByViewer}
                    className="h-10 px-6 rounded-full font-bold shadow-xs"
                    onChange={(nowFollowing, counts) =>
                      setFollowers((prev) =>
                        counts ? counts.followersCount : Math.max(prev + (nowFollowing ? 1 : -1), 0)
                      )
                    }
                  />
                  <Link
                    href={`/chat?userId=${profile.id}`}
                    className="size-10 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/20 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                    title="Direct Message"
                  >
                    <MessageSquare className="size-4.5" />
                  </Link>
                  <SecretCrushButton targetId={profile.id} targetName={profile.displayName} />
                </div>
              )}
            </div>
          </div>

          {/* Full-Width Identity Section */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {profile.displayName}
                </h1>
                <span title="Verified Campus Student">
                  <BadgeCheck className="size-5 text-primary shrink-0" />
                </span>
              </div>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>

            {/* Bio */}
            <p className="text-sm sm:text-[15px] text-foreground leading-relaxed whitespace-pre-wrap wrap-break-word">
              {profile.bio ||
                profile.headline ||
                "Building, learning, and exploring.\nBigger dreams, better code."}
            </p>

            {/* Twitter Metadata Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
              {institutionName && (
                <div className="flex items-center gap-1.5">
                  <Landmark className="size-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground/90">{institutionName}</span>
                </div>
              )}

              {(profile.course || profile.branch) && (
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="size-4 text-muted-foreground shrink-0" />
                  <span>
                    {profile.course || "B.Tech"}
                    {profile.branch ? ` · ${profile.branch}` : ""}
                    {profile.year ? ` (Year ${profile.year})` : ""}
                  </span>
                </div>
              )}

              {(profile.institution?.district || profile.institution?.state) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-muted-foreground shrink-0" />
                  <span>
                    {[profile.institution?.district, profile.institution?.state].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}

              {profile.createdAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4 text-muted-foreground shrink-0" />
                  <span>
                    Joined{" "}
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Social / Portfolio Links */}
            <ProfileSocialLinks links={profile.socialLinks} />

            {/* 3-Column Stats Row (Mockup Architecture) */}
            <div className="grid grid-cols-3 py-3 border-y border-border/30 my-3 text-center divide-x divide-border/20 select-none">
              <Link href={`/@${profile.username}/following`} className="hover:opacity-80 transition-opacity">
                <p className="text-lg font-black text-foreground">{followingCount}</p>
                <p className="text-[11px] font-medium text-muted-foreground">Following</p>
              </Link>

              <Link href={`/@${profile.username}/followers`} className="hover:opacity-80 transition-opacity">
                <p className="text-lg font-black text-foreground">{followers}</p>
                <p className="text-[11px] font-medium text-muted-foreground">Followers</p>
              </Link>

              <button
                type="button"
                onClick={() => handleTabChange("clout")}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <p className="text-lg font-black text-primary">{points}</p>
                <p className="text-[11px] font-medium text-muted-foreground">Clout</p>
              </button>
            </div>

            {/* Clean Monochromatic Topic Pills (No Joker colors!) */}
            {profile.interests && profile.interests.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center px-3 py-1 rounded-full border border-border/50 bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                  >
                    #{interest.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Tech & Coding", "Startups & AI", "Late Night Tea", "Hostel Life", "Gaming & Esports"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full border border-border/50 bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Highlights (Clean Story Viewer if exists) ─── */}
        <ProfileHighlights userId={profile.id} username={profile.username} isOwnProfile={isOwnProfile} />

        {/* ─── Campus & Academic Discipline Card ─── */}
        <div className="mx-3.5 my-2 rounded-xl border border-border/40 bg-card/55 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="size-4 text-primary" /> Academic profile
            </h3>
            <ChevronRight className="size-4 text-muted-foreground/50" />
          </div>

          <div className="flex items-start gap-3.5 pt-0.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-muted/50 border border-border/40 text-foreground text-lg shrink-0">
              <Landmark className="size-5 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-bold text-foreground truncate">
                {institutionName || "Academic profile"}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground font-medium">
                {profile.course && <span>{profile.course}</span>}
                <span>·</span>
                <Link
                  href={branchSlug ? `/branch/${branchSlug}` : "#"}
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  {profile.branch && <span>{profile.branch}</span>}
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>

              {(profile.year || profile.institution?.district || profile.institution?.state) && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                  {profile.year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3 text-muted-foreground/70" /> Year {profile.year} Student
                    </span>
                  )}
                  {(profile.institution?.district || profile.institution?.state) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3 text-muted-foreground/70" />{" "}
                      {[profile.institution?.district, profile.institution?.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Clean Subtle Discipline Tags */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="px-2.5 py-1 rounded-md bg-muted/40 border border-border/40 text-xs font-medium text-muted-foreground">
              #{profile.course ? profile.course.replace(/[^a-zA-Z0-9]/g, "") : "BTech"}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-muted/40 border border-border/40 text-xs font-medium text-muted-foreground">
              #
              {profile.branch
                ? slugifyBranch(profile.branch).toUpperCase().replace(/-/g, "").slice(0, 6)
                : "CSE"}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-muted/40 border border-border/40 text-xs font-medium text-muted-foreground">
              #
              {profile.institution?.slug
                ? profile.institution.slug.toUpperCase().replace(/-/g, "").slice(0, 10)
                : "BITSMESRA"}
            </span>
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="size-7 rounded-md bg-muted/40 border border-border/40 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                title="Add discipline tags"
              >
                <Plus className="size-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* ─── Campus Clout & Analytics Card ─── */}
        <div className="mx-3.5 my-2 rounded-xl border border-border/40 bg-card/55 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-primary" /> Campus Clout
            </h3>
            <span className="text-xs font-bold text-muted-foreground">Level {tier.level || 1}</span>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Left Gold Star Medal Icon */}
            <div className="size-11 rounded-full bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
              <Star className="size-5 fill-amber-400 text-amber-400" />
            </div>

            {/* Center Titles */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">{tier.tierName || "Rookie"}</h4>
                <span className="text-sm font-bold text-primary">
                  {points} / {tier.maxPoints + 1} LP
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Keep contributing to unlock verified perks</p>
            </div>
          </div>

          {/* Progress Bar with single-tone Twitter blue track */}
          <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(8, Math.round((points / (tier.maxPoints + 1)) * 100)))}%`,
              }}
            />
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between pt-0.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {points >= 1000 ? (
                <>
                  <Crown className="size-3 text-amber-400 inline" />
                  <span>Maximum Legend rank reached!</span>
                </>
              ) : (
                <span>{Math.max(0, tier.maxPoints + 1 - points)} LP needed for next rank</span>
              )}
            </p>

            <button
              type="button"
              onClick={() => handleTabChange("clout")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 hover:bg-muted border border-border/50 text-foreground text-xs font-semibold transition-all cursor-pointer active:scale-95"
            >
              <Crown className="size-3 text-primary" />
              <span>View Perks</span>
            </button>
          </div>
        </div>

        {/* ─── Shared Notes & Study Materials Overview Card ─── */}
        {(userResources.length > 0 || userPlaylists.length > 0) && (
          <div className="mx-3.5 my-2 rounded-xl border border-border/40 bg-card/55 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FolderPlus className="size-4 text-primary" /> Study materials ({userAcademicsCount})
              </h3>
              <button
                type="button"
                onClick={() => handleTabChange("academics")}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowUpRight className="size-3" />
              </button>
            </div>

            {/* Quick Playlists preview if any */}
            {userPlaylists.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {userPlaylists.slice(0, 2).map((pl: any) => (
                  <Link
                    key={pl.id}
                    href={`/academics/playlists/${pl.slug}`}
                    className="p-2.5 rounded-xl border border-border/40 bg-muted/30 hover:bg-muted/50 transition-colors block"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1D9BF0]/10 text-primary">
                      {pl.category?.replace("_", " ") || "Stack"}
                    </span>
                    <h4 className="text-xs font-bold text-foreground truncate mt-1">{pl.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {pl.itemsCount || 0} materials · ★ {pl.starsCount || 0}
                    </p>
                  </Link>
                ))}
              </div>
            )}

            {/* Quick Notes preview */}
            {userResources.length > 0 && (
              <div className="divide-y divide-border/20 rounded-xl border border-border/30 bg-muted/20 overflow-hidden">
                {userResources.slice(0, 3).map((res: any) => (
                  <Link
                    key={res.id}
                    href={`/academics/${res.id}`}
                    className="flex items-center justify-between p-2.5 hover:bg-muted/40 transition-colors gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-semibold">
                        <span className="font-mono text-foreground/80">{res.subjectCode}</span>
                        <span>·</span>
                        <span className="text-primary uppercase">{res.resourceType}</span>
                        <span>·</span>
                        <span>Sem {res.semester}</span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground truncate">{res.title}</h4>
                    </div>
                    <ArrowUpRight className="size-3.5 text-muted-foreground/60 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Profile Navigation Underline Tabs (Twitter Style) ─── */}
        {/* ─── Sticky content tabs: lighter than a segmented control so content stays primary. ─── */}
        <div className="sticky top-[53px] z-20 mx-0 border-y border-border/30 bg-background/88 backdrop-blur-xl">
          <div className="flex items-center overflow-x-auto px-3 no-scrollbar">
            {[
              { id: "photos", label: "Photos" },
              { id: "posts", label: "Posts" },
              { id: "articles", label: "Articles" },
              { id: "academics", label: "Notes" },
              { id: "clout", label: "Clout" },
              ...(isOwnProfile ? [{ id: "archived", label: "Archive" }] : []),
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id as any)}
                  className={cn(
                    "cl-interactive relative shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition-colors",
                    isActive
                      ? "border-primary text-foreground font-black"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Tab Content ─── */}
        {activeTab === "posts" && (
          <div className="divide-y divide-border/30">
            {posts.map((post) => (
              <FeedCard key={post.id} post={post} currentUserId={currentUserId || profile.id} />
            ))}

            {posts.length === 0 && (
              <div className="text-center py-16 border border-dashed rounded-3xl border-border bg-card text-muted-foreground text-xs font-semibold space-y-2 p-6">
                <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-primary">
                  <Flame className="size-6" />
                </div>

                <p className="font-bold text-foreground">No posts published yet.</p>
                {isOwnProfile && (
                  <Link
                    href="/post/new"
                    className="inline-block py-2 px-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer mt-2"
                  >
                    Share your first thought on CampusLoop!
                  </Link>
                )}
              </div>
            )}

            {/* Infinite Scroll Trigger Sentinel */}
            {hasMore && (
              <div ref={setSentinelNode} className="py-6 flex flex-col items-center justify-center gap-2">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Loading more campus posts...</span>
                  </div>
                )}
                {loadMoreError && !isLoadingMore && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoadMoreError(false);
                      void loadMorePosts();
                    }}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Articles Tab Content ─── */}
        {activeTab === "articles" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="size-4 text-primary" /> Published Long Reads
              </h3>
              {isOwnProfile && (
                <Link
                  href="/articles/new"
                  className="flex items-center gap-1 text-xs font-black text-primary hover:underline bg-primary/10 px-3 py-1 rounded-full border border-primary/20"
                >
                  <PenTool className="size-3" />
                  <span>Write Article (+15 LP)</span>
                </Link>
              )}
            </div>

            {isLoadingArticles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                <div className="h-56 bg-muted/30 rounded-3xl" />
                <div className="h-56 bg-muted/30 rounded-3xl" />
              </div>
            ) : userArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed rounded-3xl border-border bg-card text-muted-foreground text-xs font-semibold space-y-2 p-6">
                <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-primary">
                  <BookOpen className="size-6" />
                </div>
                <p className="font-bold text-foreground">No articles published yet.</p>
                <p className="text-[11px] text-muted-foreground">
                  {isOwnProfile
                    ? "Share placement tips, tech roadmaps, and campus journalism with your batch."
                    : `@${profile.username} hasn't published any articles yet.`}
                </p>
                {isOwnProfile && (
                  <Link
                    href="/articles/new"
                    className="inline-block py-2 px-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer mt-2"
                  >
                    Write your first article
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Shared Notes & Study Playlists Tab Content ─── */}
        {activeTab === "academics" && (
          <div className="p-4 space-y-6">
            {/* Header banner if own profile */}
            {isOwnProfile && (
              <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">Your Academic Contributions</p>
                  <p className="text-[11px] text-muted-foreground">
                    You earn +20 LP for sharing notes and +5 LP whenever classmates star your playlists.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/academics/playlists/new"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border border-border/70 hover:bg-muted/50 text-foreground transition-colors cursor-pointer"
                  >
                    <FolderPlus className="size-3" />
                    <span>New Stack</span>
                  </Link>
                  <Link
                    href="/academics"
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer"
                  >
                    <span>Upload Notes</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Playlists Section */}
            {userPlaylists.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Study Playlists &amp; Bundles ({userPlaylists.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userPlaylists.map((pl: any) => (
                    <AcademicPlaylistCard key={pl.id} playlist={pl} />
                  ))}
                </div>
              </div>
            )}

            {/* Uploaded Resources Section */}
            {userResources.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Uploaded Notes, PYQs &amp; Books ({userResources.length})
                  </h3>
                </div>
                <div className="divide-y divide-border/30 rounded-2xl border border-border/50 bg-card overflow-hidden">
                  {userResources.map((res: any) => (
                    <AcademicCard key={res.id} item={res} currentUserId={currentUserId} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingAcademics && userPlaylists.length === 0 && userResources.length === 0 && (
              <div className="text-center py-16 border border-dashed rounded-3xl border-border bg-card text-muted-foreground text-xs font-semibold space-y-2 p-6">
                <div className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                  <FolderPlus className="size-6" />
                </div>
                <p className="font-bold text-foreground">No shared notes or study playlists yet.</p>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  {isOwnProfile
                    ? "Share lecture notes, question banks, or curate a study playlist for your batch!"
                    : `@${profile.username} has not uploaded any study materials yet.`}
                </p>
                {isOwnProfile && (
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <Link
                      href="/academics/playlists/new"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-indigo-500/40 text-indigo-400 text-xs font-bold hover:bg-indigo-500/10 transition-colors shadow-xs cursor-pointer"
                    >
                      <FolderPlus className="size-3.5" />
                      <span>Create Playlist</span>
                    </Link>
                    <Link
                      href="/academics"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Upload Notes</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {isLoadingAcademics && (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-indigo-400" />
                <span className="text-xs font-medium">Loading academic vault materials...</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "photos" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {candidatePhotos.map((photoUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setShowPhotoLightbox(photoUrl)}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-border/80 shadow-xs bg-muted/30 group cursor-pointer"
                >
                  <img
                    src={photoUrl}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {idx === 0 && (
                    <span className="absolute bottom-2 left-2 bg-primary/90 text-white text-[9px] font-black px-2 py-0.5 rounded-md backdrop-blur-md">
                      Avatar
                    </span>
                  )}
                </div>
              ))}
            </div>

            {isOwnProfile && (
              <div className="pt-2 text-center">
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
                >
                  <Camera className="size-3.5 text-primary" /> Manage Dating & Profile Photos
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "clout" && (
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Trophy className="size-4 text-amber-500" /> Loop Points (LP) Rules & Privileges
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Earn Loop Points to unlock Verified Campus Star status, top your college leaderboard, and unlock
              unlimited matching.
            </p>

            <div className="grid gap-2 sm:grid-cols-2 text-xs font-semibold text-muted-foreground pt-1">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex justify-between items-center">
                <span>Invite Classmate</span>
                <span className="text-primary font-black">+20 LP</span>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex justify-between items-center">
                <span>Create Campus Thread</span>
                <span className="text-primary font-black">+5 LP</span>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex justify-between items-center">
                <span>Post Canteen Reply</span>
                <span className="text-primary font-black">+2 LP</span>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex justify-between items-center">
                <span>Upvote / Poll Vote</span>
                <span className="text-primary font-black">+1 LP</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Archived Posts Tab (Private to Student) ─── */}
        {activeTab === "archived" && (
          <div className="space-y-3.5">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Archive className="size-4" />
              </div>
              <p>
                <strong className="text-foreground font-bold">Private Post Archive:</strong> These posts are
                hidden from public campus feeds and your public profile. Only you can view, restore, or delete
                them.
              </p>
            </div>

            {isLoadingArchived ? (
              <div className="py-12 flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span>Loading your archived posts...</span>
              </div>
            ) : archivedPosts.length > 0 ? (
              archivedPosts.map((post) => (
                <div key={post.id} className="relative group">
                  <div className="rounded-3xl border border-border/60 bg-card overflow-hidden">
                    <div className="p-3 bg-muted/30 border-b border-border/40 flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Archive className="size-3.5" /> Archived Post
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestorePost(post.id)}
                          className="px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors cursor-pointer"
                        >
                          Restore to Public
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArchivedPost(post.id)}
                          className="px-3 py-1 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="size-3" /> Delete
                        </button>
                      </div>
                    </div>
                    <FeedCard post={post} currentUserId={currentUserId || profile.id} disableNavigation />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 border border-dashed rounded-3xl border-border bg-card text-muted-foreground text-xs font-semibold space-y-2 p-6">
                <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <Archive className="size-6" />
                </div>
                <p className="font-bold text-foreground">No archived posts.</p>
                <p>You can archive any of your posts anytime using the 3-dot menu on any post.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Profile Picture Click Action Modal ─── */}
      {showAvatarMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in select-none"
          onClick={() => setShowAvatarMenu(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Camera className="size-4 text-primary" /> Profile Photo Options
              </h3>
              <button
                type="button"
                onClick={() => setShowAvatarMenu(false)}
                className="size-7 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {profile.avatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAvatarMenu(false);
                    setShowPhotoLightbox(profile.avatarUrl || null);
                  }}
                  className="w-full py-2.5 px-3.5 rounded-2xl border border-border/80 bg-muted/20 hover:bg-muted/50 text-xs font-bold text-foreground flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Eye className="size-4 text-blue-500" />
                  <span>View Full-Size Photo</span>
                </button>
              )}

              {isOwnProfile && (
                <>
                  {profile.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAvatarMenu(false);
                        setCropImageUrl(profile.avatarUrl || "");
                        setCropMode("avatar");
                        setCropModalOpen(true);
                      }}
                      className="w-full py-2.5 px-3.5 rounded-2xl border border-border/80 bg-muted/20 hover:bg-muted/50 text-xs font-bold text-foreground flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Move className="size-4 text-primary" />
                      <span>Resize &amp; Crop Avatar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowAvatarMenu(false);
                      pfpInputRef.current?.click();
                    }}
                    className="w-full py-2.5 px-3.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs hover:opacity-90 active:scale-95"
                  >
                    <Camera className="size-4" />
                    <span>Upload Real Photo (+50 LP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const seed = Math.random().toString(36).substring(7);
                      const newAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
                      await fetch("/api/profile/me", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ avatarUrl: newAvatar }),
                      });
                      toast.info("Illustration set. Profiles with real photos get 3x more campus matches!");
                      setShowAvatarMenu(false);
                      router.refresh();
                    }}
                    className="w-full py-2 px-3.5 rounded-2xl border border-border/60 text-muted-foreground hover:text-foreground text-[11px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors opacity-70 hover:opacity-100"
                  >
                    <span>Use Cartoon Illustration (Lower Reach)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Lightbox Modal ─── */}
      {showPhotoLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowPhotoLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setShowPhotoLightbox(null)}
            className="absolute top-4 right-4 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="size-5" />
          </button>
          <img
            src={showPhotoLightbox}
            alt="Full Photo"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ─── Branded Cute QR Code Modal ─── */}
      <BrandedQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={profile.displayName}
        subtitle={`@${profile.username} • ${profile.institution?.name || "Verified Student"}`}
        badgeText="Verified Student Network"
        shortUrl={`https://campusloop.space/@${profile.username}`}
        avatarUrl={profile.avatarUrl}
        category="profile"
      />

      {/* Unsplash Profile Cover Picker */}
      <UnsplashImagePicker
        isOpen={showUnsplashBannerPicker}
        onClose={() => setShowUnsplashBannerPicker(false)}
        onSelect={(photo) => {
          void handleSelectUnsplashBanner(photo.url);
        }}
        defaultQuery="campus aesthetic"
        title="Choose Profile Cover from Unsplash"
      />
    </div>
  );
}
