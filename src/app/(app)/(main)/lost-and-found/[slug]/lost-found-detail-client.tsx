"use client";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Gift,
  MapPin,
  MessageCircle,
  PackageSearch,
  QrCode,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { BrandedQrModal } from "@/components/common/branded-qr-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { absoluteUrl } from "@/lib/seo/constants";
import { sounds } from "@/lib/sounds";
import { formatTimeAgo, getAvatarUrl } from "@/lib/utils";
import { ItemMatches } from "./item-matches";

interface Props {
  slug: string;
  currentProfileId: string | null;
  userCampusId: string | null;
}

function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6" aria-busy="true" aria-label="Loading item">
      <Skeleton className="h-10 w-32 rounded-full" />
      <Skeleton className="aspect-video w-full rounded-lg" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}

export function LostFoundDetailClient({ slug, currentProfileId }: Props) {
  const router = useRouter();
  const [showQrModal, setShowQrModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const { data, error, isLoading } = useSWR<{
    item: any;
    potentialMatches: any[];
    similarReports: any[];
  }>(`/api/lost-and-found/${slug}`, fetcher, { revalidateOnFocus: false });

  const item = data?.item;

  if (isLoading) return <DetailSkeleton />;

  if (error || !item) {
    return (
      <EmptyState
        className="min-h-[60vh]"
        icon={PackageSearch}
        title="This report isn't here"
        description="It may have been returned or deleted by the person who posted it."
        action={
          <Button asChild>
            <Link href="/lost-and-found">Go to lost and found</Link>
          </Button>
        }
      />
    );
  }

  const isOwner = currentProfileId === item.authorId;
  const isLost = item.type === "LOST";
  const shareUrl = absoluteUrl(`/lost-and-found/${item.slug || item.id}`);
  const avatar = getAvatarUrl(item.author.avatarUrl, item.author.username);

  async function handleToggleResolve() {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/lost-and-found/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: !item.isResolved }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      sounds.ting();
      haptics.success();
      toast.success(item.isResolved ? "Report is open again" : "Marked as returned");
      mutate(`/api/lost-and-found/${slug}`);
    } catch {
      toast.error("Couldn't update this report. Check your connection and try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function handleShare() {
    sounds.tap();
    haptics.light();
    const url = typeof window !== "undefined" ? window.location.href : shareUrl;
    if (navigator.share) {
      navigator
        .share({
          title: `${isLost ? "Lost" : "Found"}: ${item.title}`,
          text: `Can you help? ${item.title} (${item.location})`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(
        () => toast.success("Link copied"),
        () => toast.error("Couldn't copy the link. Copy it from the address bar.")
      );
    }
  }

  function handleContact() {
    sounds.tap();
    haptics.light();
    if (item.contactInfo) {
      navigator.clipboard.writeText(item.contactInfo).then(
        () => toast.success(`Contact copied: ${item.contactInfo}`),
        () => toast.info(`Contact: ${item.contactInfo}`)
      );
    } else {
      router.push(`/chat?recipient=${item.author.username}`);
    }
  }

  const status = item.isResolved
    ? { label: "Returned", variant: "success" as const }
    : isLost
      ? { label: "Lost", variant: "warning" as const }
      : { label: "Found", variant: "neutral" as const };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 pt-4 pb-28 sm:pt-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/lost-and-found">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Lost and found
          </Link>
        </Button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleShare}
            aria-label="Share this report"
          >
            <Share2 className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowQrModal(true)}
            aria-label="Show QR code"
          >
            <QrCode className="size-4" />
          </Button>
        </div>
      </div>

      {item.imageUrl && (
        <button
          type="button"
          onClick={() => setPhotoOpen(true)}
          aria-label="Open photo"
          className="block aspect-video w-full cursor-zoom-in overflow-hidden rounded-lg border border-border bg-surface-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img src={item.imageUrl} alt={item.title} className="size-full object-cover" />
        </button>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <Badge variant="outline">{item.category}</Badge>
          {item.reward && !item.isResolved && (
            <Badge variant="outline">
              <Gift className="size-3" aria-hidden="true" />
              Reward: {item.reward}
            </Badge>
          )}
        </div>
        <h1 className="text-balance text-3xl text-fg">{item.title}</h1>
        <dl className="space-y-1.5 text-sm text-fg-muted">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Where</dt>
            <dd>
              {item.location}
              {item.institution?.name ? `, ${item.institution.name}` : ""}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">When</dt>
            <dd>
              {item.itemDate ? `${item.itemDate}, ` : ""}posted {formatTimeAgo(item.createdAt)}
            </dd>
          </div>
        </dl>
      </div>

      {item.isResolved && (
        <div className="flex items-center gap-3 rounded-lg bg-verified-subtle p-4 text-sm text-verified-text">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
          <p className="font-semibold">This item is back with its owner.</p>
        </div>
      )}

      {item.description && (
        <p className="whitespace-pre-wrap text-pretty text-base leading-relaxed text-fg">
          {item.description}
        </p>
      )}

      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
        <Link
          href={`/@${item.author.username}`}
          className="flex min-w-0 flex-1 items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <Avatar className="size-11 shrink-0">
            <AvatarImage src={avatar} alt="" />
            <AvatarFallback className="text-xs font-semibold">
              {item.author.displayName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">{item.author.displayName}</p>
            <p className="truncate text-xs text-fg-muted">
              @{item.author.username}
              {item.institution?.name ? ` · ${item.institution.name.split(",")[0]}` : ""}
            </p>
          </div>
        </Link>
      </div>

      {isOwner || !item.isResolved ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {!item.isResolved && !isOwner && (
            <Button type="button" onClick={handleContact} className="sm:flex-1">
              <MessageCircle className="size-4" aria-hidden="true" />
              {isLost ? "I found this" : "This is mine"}
            </Button>
          )}
          {isOwner && (
            <Button
              type="button"
              variant={item.isResolved ? "secondary" : "success"}
              onClick={handleToggleResolve}
              loading={isUpdatingStatus}
              className="sm:flex-1"
            >
              {!isUpdatingStatus && <CheckCircle2 className="size-4" aria-hidden="true" />}
              {item.isResolved ? "Open this report again" : "Mark as returned"}
            </Button>
          )}
        </div>
      ) : null}

      <ItemMatches
        isLost={isLost}
        category={item.category}
        potentialMatches={data?.potentialMatches || []}
        similarReports={data?.similarReports || []}
      />

      <BrandedQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={item.title}
        subtitle={`${isLost ? "Lost" : "Found"} at ${item.location}`}
        badgeText="Lost and found"
        shortUrl={shareUrl}
        category="general"
      />

      {item.imageUrl && (
        <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
          <DialogContent className="max-w-3xl p-3 sm:p-4">
            <DialogTitle className="sr-only">{item.title}</DialogTitle>
            <img
              src={item.imageUrl}
              alt={item.title}
              className="max-h-[80vh] w-full rounded-md object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
