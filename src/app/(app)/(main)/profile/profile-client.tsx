"use client";

import { MessageCircle, PenLine } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { SecretCrushButton } from "@/components/dating/secret-crush-button";
import { FollowButton } from "@/components/profile/follow-button";
import { ProfileHighlights } from "@/components/profile/profile-highlights";
import { ProfileAvatar, ProfileIdentity } from "@/components/profile/profile-identity";
import type { ProfileView } from "@/components/profile/profile-view-model";
import { isOfficialProfile } from "@/components/profile/profile-view-model";
import { StreakBadge } from "@/components/streaks/streak-badge";
import { Button } from "@/components/ui/button";
import { LoopPointsSticker } from "@/components/ui/stickers";
import type { FeedPost } from "@/hooks/use-feed";
import { fetcher } from "@/lib/api";
import { ProfileCoverActions } from "./profile-cover-actions";
import { AvatarOptionsDialog, PhotoLightbox } from "./profile-dialogs";
import { type ProfileTab, ProfileTabBar, tabFromParam } from "./profile-tab-bar";
import { ArchiveTab } from "./tabs/archive-tab";
import { ArticlesTab } from "./tabs/articles-tab";
import { NotesTab } from "./tabs/notes-tab";
import { PhotosTab } from "./tabs/photos-tab";
import { PointsTab } from "./tabs/points-tab";
import { PostsTab } from "./tabs/posts-tab";
import { useProfileMedia } from "./use-profile-media";
import { useProfilePosts } from "./use-profile-posts";

const BrandedQrModal = dynamic(
  () => import("@/components/common/branded-qr-modal").then((m) => m.BrandedQrModal),
  {
    ssr: false,
  }
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
  {
    ssr: false,
  }
);

interface ProfileClientViewProps {
  profile: ProfileView;
  formattedPosts: FeedPost[];
  isOwnProfile: boolean;
  currentUserId?: string;
  followersCount?: number;
  followingCount?: number;
  friendsCount?: number;
  isFollowedByViewer?: boolean;
}

const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

export function ProfileClientView({
  profile,
  formattedPosts,
  isOwnProfile,
  currentUserId,
  followersCount = 0,
  followingCount = 0,
  friendsCount = 0,
  isFollowedByViewer = false,
}: ProfileClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>(tabFromParam(searchParams?.get("tab")) ?? "posts");
  const [followers, setFollowers] = useState(followersCount);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  useEffect(() => {
    const tab = tabFromParam(searchParams?.get("tab"));
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  function changeTab(tab: ProfileTab) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "posts") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }

  const isViewerMode =
    searchParams?.get("mode") === "viewer" ||
    searchParams?.get("viewer") === "true" ||
    searchParams?.get("view") === "viewer";
  const feed = useProfilePosts(profile.id, formattedPosts, {
    capped: !isOwnProfile && isViewerMode,
    enabled: activeTab === "posts",
  });
  const {
    avatarInputRef,
    bannerInputRef,
    closeCrop,
    crop,
    currentAvatarUrl,
    currentBannerUrl,
    onAvatarFile,
    onBannerFile,
    onCropDone,
    openCrop,
    setBannerFromUrl,
  } = useProfileMedia(profile);

  const { data: articlesData, isLoading: articlesLoading } = useSWR<{ articles: unknown[] }>(
    `/api/articles/user/${profile.username}`,
    fetcher,
    { dedupingInterval: 60000 }
  );
  const { data: notesData, isLoading: notesLoading } = useSWR<{
    resources: unknown[];
    playlists: unknown[];
    totalCount: number;
  }>(`/api/profile/${profile.username}/academics`, fetcher, { dedupingInterval: 30000 });
  const articles = articlesData?.articles ?? [];
  const notesCount = notesData?.totalCount ?? 0;

  const points = profile.points ?? 0;
  const photos = profile.photos?.length ? profile.photos : profile.avatarUrl ? [profile.avatarUrl] : [];
  const viewerId = currentUserId || profile.id;
  const institutionName = profile.institution?.name ?? "";

  async function setCartoonAvatar() {
    const seed = Math.random().toString(36).substring(7);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`,
        }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success("Cartoon avatar set");
      router.refresh();
    } catch {
      toast.error("Couldn't change your avatar. Try again.");
    }
  }

  const actions = isOwnProfile ? (
    <Button asChild>
      <Link href="/profile/edit">
        <PenLine aria-hidden="true" />
        Edit profile
      </Link>
    </Button>
  ) : (
    <>
      <SecretCrushButton
        targetId={profile.id}
        targetName={profile.displayName}
        iconOnly
        className="size-11"
      />
      <Button asChild variant="outline" size="icon" aria-label={`Message ${profile.displayName}`}>
        <Link href={`/chat?userId=${profile.id}`}>
          <MessageCircle aria-hidden="true" />
        </Link>
      </Button>
      <FollowButton
        username={profile.username}
        displayName={profile.displayName}
        initialIsFollowing={isFollowedByViewer}
        onChange={(now, counts) =>
          setFollowers((prev) => (counts ? counts.followersCount : Math.max(prev + (now ? 1 : -1), 0)))
        }
      />
    </>
  );

  const tabs: { id: ProfileTab; label: string; count?: number }[] = [
    { id: "posts", label: "Posts" },
    { id: "photos", label: "Photos", count: photos.length },
    { id: "articles", label: "Articles", count: articles.length },
    { id: "academics", label: "Notes", count: notesCount },
    { id: "clout", label: "Points" },
    ...(isOwnProfile ? [{ id: "archived" as const, label: "Archive" }] : []),
  ];

  return (
    <div className="min-h-dvh pb-28 text-fg">
      <input
        ref={bannerInputRef}
        type="file"
        accept={IMAGE_TYPES}
        className="hidden"
        onChange={onBannerFile}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept={IMAGE_TYPES}
        className="hidden"
        onChange={onAvatarFile}
      />

      <div className="mx-auto -mt-4 w-full max-w-5xl sm:-mt-6 lg:mt-0">
        <ProfileIdentity
          displayName={profile.displayName}
          username={profile.username}
          bannerUrl={currentBannerUrl}
          avatarUrl={currentAvatarUrl}
          institution={profile.institution}
          course={profile.course}
          branch={profile.branch}
          year={profile.year}
          bio={profile.bio || profile.headline}
          socialLinks={profile.socialLinks}
          interests={profile.interests}
          isVerified={profile.isVerified}
          isOfficial={isOfficialProfile(profile)}
          isOwnProfile={isOwnProfile}
          actions={actions}
          coverActions={
            <ProfileCoverActions
              isOwnProfile={isOwnProfile}
              hasBanner={Boolean(currentBannerUrl)}
              onShare={() => setShareOpen(true)}
              onQr={() => setQrOpen(true)}
              onPickCover={() => setCoverPickerOpen(true)}
              onUploadCover={() => bannerInputRef.current?.click()}
              onRepositionCover={() => currentBannerUrl && openCrop(currentBannerUrl, "banner")}
            />
          }
          avatarSlot={
            isOwnProfile ? (
              <button
                type="button"
                onClick={() => setAvatarMenuOpen(true)}
                className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Change profile photo"
              >
                <ProfileAvatar displayName={profile.displayName} avatarUrl={currentAvatarUrl} />
              </button>
            ) : undefined
          }
          extra={
            isOwnProfile ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeTab("clout")}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${points} Loop Points. See your points`}
                >
                  <LoopPointsSticker points={points} size="sm" />
                </button>
                <StreakBadge />
              </div>
            ) : undefined
          }
          stats={[
            {
              label: feed.posts.length === 1 ? "post" : "posts",
              value: feed.hasMore ? `${feed.posts.length}+` : feed.posts.length,
              onClick: () => changeTab("posts"),
            },
            { label: "followers", value: followers, href: `/@${profile.username}/followers` },
            { label: "following", value: followingCount, href: `/@${profile.username}/following` },
            { label: "friends", value: friendsCount, href: `/@${profile.username}/friends` },
          ]}
        />

        <ProfileHighlights userId={profile.id} username={profile.username} isOwnProfile={isOwnProfile} />

        <ProfileTabBar tabs={tabs} active={activeTab} onChange={changeTab} />

        <div role="tabpanel" id={`profile-panel-${activeTab}`} aria-labelledby={`profile-tab-${activeTab}`}>
          {activeTab === "posts" && (
            <PostsTab
              {...feed}
              currentUserId={viewerId}
              isOwnProfile={isOwnProfile}
              username={profile.username}
            />
          )}
          {activeTab === "articles" && (
            <ArticlesTab
              articles={articles as any[]}
              isLoading={articlesLoading}
              isOwnProfile={isOwnProfile}
              username={profile.username}
            />
          )}
          {activeTab === "academics" && (
            <NotesTab
              playlists={(notesData?.playlists ?? []) as any[]}
              resources={(notesData?.resources ?? []) as any[]}
              isLoading={notesLoading}
              isOwnProfile={isOwnProfile}
              username={profile.username}
              currentUserId={currentUserId}
            />
          )}
          {activeTab === "photos" && (
            <PhotosTab
              photos={photos}
              isOwnProfile={isOwnProfile}
              displayName={profile.displayName}
              onOpen={setLightboxUrl}
            />
          )}
          {activeTab === "clout" && (
            <PointsTab profileId={profile.id} points={points} isOwnProfile={isOwnProfile} />
          )}
          {activeTab === "archived" && isOwnProfile && <ArchiveTab currentUserId={viewerId} />}
        </div>
      </div>

      {crop && (
        <ImageCropModal
          isOpen
          onClose={closeCrop}
          imageUrl={crop.url}
          mode={crop.mode}
          onCropComplete={onCropDone}
        />
      )}

      <AvatarOptionsDialog
        open={avatarMenuOpen}
        onOpenChange={setAvatarMenuOpen}
        hasPhoto={Boolean(currentAvatarUrl)}
        onView={() => setLightboxUrl(currentAvatarUrl)}
        onCrop={() => currentAvatarUrl && openCrop(currentAvatarUrl, "avatar")}
        onUpload={() => avatarInputRef.current?.click()}
        onCartoon={() => void setCartoonAvatar()}
      />
      <PhotoLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />

      <BrandedQrModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        title={profile.displayName}
        subtitle={`@${profile.username}${institutionName ? ` · ${institutionName}` : ""}`}
        badgeText={profile.isVerified ? "Verified student" : "CampusLoop"}
        shortUrl={`https://campusloop.space/@${profile.username}`}
        avatarUrl={currentAvatarUrl}
        category="profile"
      />
      <ShareProfileModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        profile={{
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: currentAvatarUrl,
          institutionName,
          branch: profile.branch,
          course: profile.course,
          points,
        }}
      />
      <UnsplashImagePicker
        isOpen={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={(photo) => void setBannerFromUrl(photo.url)}
        defaultQuery="campus"
        title="Pick a cover photo"
      />
    </div>
  );
}
