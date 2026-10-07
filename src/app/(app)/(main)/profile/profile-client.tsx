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
  MessageCircle,
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
  Zap,
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
import { ProfileStreakCard } from "@/components/streaks/profile-streak-card";
import { useStreaks } from "@/hooks/use-streaks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeedCard } from "@/components/ui/feed-card";
import { getBranchIcon, slugifyBranch } from "@/constants";

const BrandedQrModal = dynamic(
  () => import("@/components/common/branded-qr-modal").then((m) => m.BrandedQrModal),
  { ssr: false }
);
const ShareProfileModal = dynamic(
  () => import("@/components/profile/share-profile-modal").then((m) => m.ShareProfileModal),
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
  const { streak: profileStreak } = useStreaks(profile.id);

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
  const [showShareModal, setShowShareModal] = useState(false);
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

  // ─── Infinite Scroll for Profile Posts (Enforce 5-post cap in viewer mode) ───
  const isViewerMode =
    searchParams?.get("viewer") === "true" ||
    searchParams?.get("mode") === "viewer" ||
    searchParams?.get("view") === "viewer";

  const effectiveInitialPosts = !isOwnProfile && isViewerMode ? initialPosts.slice(0, 5) : initialPosts;
  const [posts, setPosts] = useState<FeedPost[]>(effectiveInitialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(!(!isOwnProfile && isViewerMode) && initialPosts.length >= 20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const nextPosts = !isOwnProfile && isViewerMode ? initialPosts.slice(0, 5) : initialPosts;
    setPosts(nextPosts);
    setHasMore(!(!isOwnProfile && isViewerMode) && initialPosts.length >= 20);
    setPage(1);
    setLoadMoreError(false);
  }, [initialPosts, isOwnProfile, isViewerMode]);

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

  function handleShareVibe() {
    setShowShareModal(true);
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
    <div className="min-h-screen pb-28 text-foreground touch-manipulation">
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

      <main className="mx-auto min-h-screen w-full max-w-5xl lg:max-w-6xl">
        {/* ─── Profile Cover Banner (Cinematic Full-Bleed Canvas with Ambient Glow) ─── */}
        <div className="relative h-44 sm:h-60 lg:h-72 w-full bg-[#16181C] overflow-hidden rounded-b-2xl sm:rounded-b-3xl shadow-sm">
          {currentBannerUrl ? (
            <img src={currentBannerUrl} alt="Cover Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-b from-neutral-800/60 via-[#16181C] to-[#121417] relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>
          )}

          {/* Ambient protection gradient overlays */}
          <div className="absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-black/35 pointer-events-none" />

          {/* Floating Campus Badge in Banner (Bottom Right) */}
          {campusShort && (
            <div className="absolute bottom-3 right-4 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-white/90 text-xs font-semibold shadow-md pointer-events-none">
              <Landmark className="size-3.5 text-primary" />
              <span>{campusShort}</span>
            </div>
          )}

          {/* Floating Back Button (Top-Left) */}
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute top-3 left-3 z-20 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-all cursor-pointer shadow-md active:scale-95"
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>

          {/* Floating Action Controls (Top-Right: QR, Share, More, Banner edit) */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-all cursor-pointer shadow-md active:scale-95"
              title="Profile QR Card"
              aria-label="Profile QR Card"
            >
              <QrCode className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-all cursor-pointer shadow-md active:scale-95"
              title="Share Profile"
              aria-label="Share Profile"
            >
              <Share2 className="size-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu((v) => !v)}
                className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-all cursor-pointer shadow-md active:scale-95"
                title="More Options"
                aria-label="More profile actions"
              >
                <MoreVertical className="size-4" />
              </button>

              {showProfileMenu && (
                <>
                  <button
                    type="button"
                    aria-label="Close profile actions"
                    className="fixed inset-0 z-30 cursor-default bg-transparent"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 top-11 z-40 w-48 rounded-2xl border border-border/60 bg-popover p-1.5 text-popover-foreground shadow-2xl">
                    {isOwnProfile ? (
                      <Link
                        href="/profile/edit"
                        onClick={() => setShowProfileMenu(false)}
                        className="cl-interactive flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-muted"
                      >
                        <Edit3 className="size-4 text-primary" />
                        Edit profile
                      </Link>
                    ) : (
                      <Link
                        href={`/chat?userId=${profile.id}`}
                        onClick={() => setShowProfileMenu(false)}
                        className="cl-interactive flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-muted"
                      >
                        <MessageSquare className="size-4" />
                        Message
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowShareModal(true);
                      }}
                      className="cl-interactive flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold hover:bg-muted cursor-pointer"
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
                      className="cl-interactive flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold hover:bg-muted cursor-pointer"
                    >
                      <QrCode className="size-4" />
                      QR card
                    </button>
                  </div>
                </>
              )}
            </div>

            {isOwnProfile && (
              <>
                <button
                  type="button"
                  onClick={() => setShowUnsplashBannerPicker(true)}
                  className="hidden sm:flex size-9 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
                  title="Choose Cover from Unsplash"
                >
                  <Sparkles className="size-4 text-primary" />
                </button>
                {currentBannerUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setCropImageUrl(currentBannerUrl || "");
                      setCropMode("banner");
                      setCropModalOpen(true);
                    }}
                    className="size-9 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
                    title="Reposition Banner"
                  >
                    <Move className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="size-9 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
                  title="Change Cover Banner"
                >
                  <Camera className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ─── Profile Header Main Info (Clean Social Identity Architecture) ─── */}
        <div className="px-4 sm:px-6 pb-4">
          {/* Avatar & Action Buttons Bar */}
          <div className="flex items-end justify-between -mt-14 sm:-mt-20 lg:-mt-24 mb-3 relative z-10">
            {/* Clickable Circular Profile Picture with Online Status & Verified Badge */}
            <div className="relative group">
              <div
                onClick={() => {
                  if (isOwnProfile) setShowAvatarMenu(true);
                }}
                className="relative size-28 sm:size-36 lg:size-40 rounded-full ring-4 ring-background shadow-2xl border-2 border-primary/25 overflow-hidden bg-background cursor-pointer group-hover:opacity-95 transition-opacity"
              >
                <Avatar className="size-full">
                  <AvatarImage src={currentAvatarUrl || ""} className="object-cover size-full" />
                  <AvatarFallback className="text-3xl sm:text-4xl font-black bg-muted text-foreground">
                    {profile.displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="size-6 text-white" />
                  </div>
                )}
              </div>

              {points >= 150 && (
                <span
                  className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 size-7 sm:size-8 rounded-full bg-background flex items-center justify-center shadow-lg border border-border/40"
                  title="Verified Campus Student"
                >
                  <BadgeCheck className="size-5 sm:size-6 text-[#1D9BF0] shrink-0" />
                </span>
              )}
            </div>

            {/* Action Buttons: Edit Profile (Own) or Message/Follow (Viewer) */}
            <div className="flex items-center gap-2 pb-1 sm:pb-2">
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="h-9 px-3.5 rounded-full border border-border/70 bg-card hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                title="Share Profile"
              >
                <Share2 className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Share</span>
              </button>

              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="h-9 px-3.5 rounded-full border border-border/70 bg-card hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                  >
                    <QrCode className="size-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">QR Card</span>
                  </button>
                  <Link
                    href="/profile/edit"
                    className="h-9 px-5 rounded-full bg-primary hover:bg-primary/95 text-xs font-bold text-primary-foreground shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Edit profile</span>
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <FollowButton
                    username={profile.username}
                    displayName={profile.displayName}
                    initialIsFollowing={isFollowedByViewer}
                    className="h-9 px-6 rounded-full font-bold shadow-xs bg-primary hover:bg-primary/95 text-primary-foreground"
                    onChange={(nowFollowing, counts) =>
                      setFollowers((prev) =>
                        counts ? counts.followersCount : Math.max(prev + (nowFollowing ? 1 : -1), 0)
                      )
                    }
                  />
                  <Link
                    href={`/chat?userId=${profile.id}`}
                    className="group relative inline-flex h-9 w-9 sm:w-10 items-center justify-center rounded-full border border-border/70 bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-2xs hover:border-primary/40 hover:shadow-primary/10 transition-all cursor-pointer shrink-0 active:scale-95 before:absolute before:-inset-1.5 before:content-['']"
                    title="Message"
                    aria-label="Message"
                  >
                    <MessageCircle className="size-5 text-secondary-foreground transition-transform group-hover:scale-105 shrink-0" />
                  </Link>
                  <SecretCrushButton targetId={profile.id} targetName={profile.displayName} iconOnly />
                </div>
              )}
            </div>
          </div>

          {/* Full-Width Identity Section with Intentional Hierarchy */}
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                  {profile.displayName}
                </h1>
                {points >= 150 && (
                  <span title="Verified Campus Student">
                    <BadgeCheck className="size-5 sm:size-6 text-[#1D9BF0] shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-medium text-muted-foreground mt-0.5">
                @{profile.username}
              </p>
            </div>

            {/* Academic Credentials & Campus Row */}
            <div className="space-y-1 text-xs sm:text-sm">
              {(profile.course || profile.branch) && (
                <div className="flex items-center gap-2 font-semibold text-foreground/90">
                  <GraduationCap className="size-4 text-primary shrink-0" />
                  <span>
                    {profile.course || "B.Tech"}
                    {profile.branch ? ` ${profile.branch}` : ""}
                    {profile.year ? ` · Year ${profile.year}` : ""}
                  </span>
                </div>
              )}

              {institutionName && (
                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Landmark className="size-4 text-muted-foreground/80 shrink-0" />
                  <span>{institutionName}</span>
                </div>
              )}
            </div>

            {/* Bio as Personality Layer */}
            {profile.bio || profile.headline ? (
              <div className="max-w-3xl pt-1">
                <p className="text-sm sm:text-[15px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {profile.bio || profile.headline}
                </p>
              </div>
            ) : isOwnProfile ? (
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors italic pt-1"
              >
                <Plus className="size-3" />
                <span>Add a personal bio or motto...</span>
              </Link>
            ) : null}

            {/* Compact Social Identity Bar */}
            <ProfileSocialLinks links={profile.socialLinks} isOwnProfile={isOwnProfile} />

            {/* Borderless Reputation Strip */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-2.5 border-y border-border/25 my-2 text-xs">
              {/* Loop Points & Clout Rank */}
              <button
                type="button"
                onClick={() => handleTabChange("clout")}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-105 transition-transform">
                  <Zap className="size-3.5 fill-amber-500/30" />
                </span>
                <div className="text-left leading-tight">
                  <div className="font-black text-foreground text-xs sm:text-sm flex items-center gap-1">
                    <span>{points} LP</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">· {tier.tierName || "Rookie"}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Campus Standing</span>
                </div>
              </button>

              {/* Day Streak */}
              <Link
                href="/streak"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                title="View streak details"
              >
                <div className="text-left leading-tight">
                  <span className="font-black text-foreground text-xs sm:text-sm flex items-center gap-1">
                    <span>{profileStreak?.currentStreak ?? 0}</span>
                    <Flame className="size-3 text-amber-500 fill-amber-500/20 inline" />
                  </span>
                  <span className="text-[10px] text-muted-foreground">Day streak</span>
                </div>
              </Link>

              {/* Followers */}
              <Link
                href={`/@${profile.username}/followers`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="text-left leading-tight">
                  <span className="font-black text-foreground text-xs sm:text-sm block">{followers}</span>
                  <span className="text-[10px] text-muted-foreground">Followers</span>
                </div>
              </Link>

              {/* Following */}
              <Link
                href={`/@${profile.username}/following`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="text-left leading-tight">
                  <span className="font-black text-foreground text-xs sm:text-sm block">{followingCount}</span>
                  <span className="text-[10px] text-muted-foreground">Following</span>
                </div>
              </Link>

              {/* Contributions */}
              <div className="flex items-center gap-2 ml-auto text-muted-foreground text-[11px] font-medium hidden sm:flex">
                <span>{posts.length} Posts</span>
                <span>·</span>
                <span>{userAcademicsCount} Notes</span>
                <span>·</span>
                <span>{userArticles.length} Articles</span>
              </div>
            </div>

            {/* Clean Interests Chips */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-secondary text-secondary-foreground text-[11px] font-semibold transition-colors"
                  >
                    #{interest.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Highlights (Clean Story Viewer if exists) ─── */}
        <ProfileHighlights userId={profile.id} username={profile.username} isOwnProfile={isOwnProfile} />

        {/* ─── Profile Navigation Underline Tabs (Twitter Style) ─── */}
        <div className="sticky top-[53px] z-20 mx-0 border-y border-border/30 bg-background/88 backdrop-blur-xl">
          <div className="flex items-center overflow-x-auto px-3 no-scrollbar">
            {[
              { id: "posts", label: "Posts" },
              { id: "photos", label: "Photos", count: candidatePhotos.length },
              { id: "articles", label: "Articles", count: userArticles.length },
              { id: "academics", label: "Notes", count: userAcademicsCount },
              { id: "clout", label: "Clout" },
              ...(isOwnProfile ? [{ id: "archived", label: "Archive", count: archivedPosts.length }] : []),
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id as any)}
                  className={cn(
                    "cl-interactive relative shrink-0 border-b-2 px-3.5 py-3 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer",
                    isActive
                      ? "border-primary text-foreground font-black"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-semibold tabular-nums",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
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
          <div className="p-4 space-y-4">
            {/* Campus Streak & Milestones Progression */}
            <ProfileStreakCard profileId={profile.id} />

            {/* Campus Clout Standing & Tier Card */}
            <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-primary" /> Campus Clout Standing
                </h3>
                <span className="text-xs font-bold text-muted-foreground">Level {tier.level || 1}</span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="size-11 rounded-full bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Star className="size-5 fill-amber-400 text-amber-400" />
                </div>

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

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(8, Math.round((points / (tier.maxPoints + 1)) * 100)))}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                <p className="flex items-center gap-1">
                  {points >= 1000 ? (
                    <>
                      <Crown className="size-3 text-amber-400 inline" />
                      <span>Maximum Legend rank reached!</span>
                    </>
                  ) : (
                    <span>{Math.max(0, tier.maxPoints + 1 - points)} LP needed for next rank</span>
                  )}
                </p>

                {isOwnProfile && (
                  <Link
                    href={`/@${profile.username}`}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Referral Link
                  </Link>
                )}
              </div>
            </div>

            {/* Loop Points Rules & Privileges */}
            <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 space-y-4 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Trophy className="size-4 text-amber-500" /> Loop Points (LP) Rules &amp; Privileges
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Earn Loop Points to unlock Verified Campus Star status, top your college leaderboard, and unlock
                unlimited matching.
              </p>

              <div className="grid gap-2 sm:grid-cols-2 text-xs font-semibold text-muted-foreground pt-1">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex justify-between items-center">
                  <span>Invite Classmate</span>
                  <span className="text-primary font-black">+20 LP</span>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex justify-between items-center">
                  <span>Create Campus Thread</span>
                  <span className="text-primary font-black">+5 LP</span>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex justify-between items-center">
                  <span>Post Canteen Reply</span>
                  <span className="text-primary font-black">+2 LP</span>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex justify-between items-center">
                  <span>Upvote / Poll Vote</span>
                  <span className="text-primary font-black">+1 LP</span>
                </div>
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

      {/* ─── Share Profile Modal ─── */}
      <ShareProfileModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        profile={{
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: currentAvatarUrl,
          institutionName: institutionName,
          branch: profile.branch,
          course: profile.course,
          points: points,
        }}
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
