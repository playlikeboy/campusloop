"use client";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Gift,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  PackageSearch,
  School,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { BrandedQrModal } from "@/components/common/branded-qr-modal";
import { LostFoundCard } from "@/components/communities/lost-found-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo, getAvatarUrl } from "@/lib/utils";

interface Props {
  slug: string;
  currentProfileId: string | null;
  userCampusId: string | null;
}

export function LostFoundDetailClient({ slug, currentProfileId, userCampusId }: Props) {
  const router = useRouter();
  const [showQrModal, setShowQrModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  const { data, error, isLoading } = useSWR<{
    item: any;
    potentialMatches: any[];
    similarReports: any[];
  }>(`/api/lost-and-found/${slug}`, fetcher, {
    revalidateOnFocus: false,
  });

  const item = data?.item;
  const potentialMatches = data?.potentialMatches || [];
  const similarReports = data?.similarReports || [];

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">Searching campus recovery records...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4">
        <div className="size-14 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-center">
          <PackageSearch className="size-7 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Item Not Found</h2>
          <p className="text-xs text-muted-foreground mt-1">
            This item may have been resolved, returned, or removed by its owner.
          </p>
        </div>
        <Link
          href="/lost-and-found"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-xs"
        >
          <ArrowLeft className="size-3.5" />
          <span>Return to Lost &amp; Found Hub</span>
        </Link>
      </div>
    );
  }

  const isOwner = currentProfileId === item.authorId;
  const isLost = item.type === "LOST";
  const avatar = getAvatarUrl(item.author.avatarUrl, item.author.username);

  async function handleToggleResolve() {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/lost-and-found/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: !item.isResolved }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      sounds.ting();
      haptics.success();
      toast.success(
        !item.isResolved
          ? "Item marked as resolved and reunited!"
          : "Report reopened as active recovery"
      );
      mutate(`/api/lost-and-found/${slug}`);
    } catch {
      toast.error("Failed to update item status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function handleShare() {
    sounds.tap();
    haptics.light();
    const url = typeof window !== "undefined" ? window.location.href : `https://campusloop.space/lost-and-found/${item.slug || item.id}`;

    if (navigator.share) {
      navigator
        .share({
          title: `[${item.type}] ${item.title} — Campus Recovery`,
          text: `Help return this item on campus: ${item.title} (${item.location})`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lost & Found recovery link copied!");
    }
  }

  function handleContactOwner() {
    sounds.tap();
    haptics.light();
    if (item.contactInfo) {
      navigator.clipboard.writeText(item.contactInfo);
      toast.success(`Contact copied: ${item.contactInfo}`);
    } else {
      router.push(`/chat?recipient=${item.author.username}`);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col min-h-screen pb-28 border-x border-border/20 bg-background text-foreground select-none">
      {/* ─── Sticky Header ─── */}
      <header className="sticky top-12 lg:top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => router.push("/lost-and-found")}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
            aria-label="Back to Lost & Found"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>{item.category}</span>
              <span>•</span>
              <span className={isLost ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>
                {isLost ? "Lost Item" : "Found Item"}
              </span>
            </span>
            <h1 className="text-sm font-black text-foreground truncate">{item.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="flex size-9 items-center justify-center rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Share recovery link"
          >
            <Share2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex size-9 items-center justify-center rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="QR Code"
          >
            <Zap className="size-4 text-primary" />
          </button>
        </div>
      </header>

      {/* ─── Hero Card & Photo ─── */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Photo Container */}
        {item.imageUrl && (
          <div className="relative aspect-16/9 w-full rounded-3xl overflow-hidden border border-border/50 bg-muted/20 shadow-xs group">
            <img
              src={item.imageUrl}
              alt={item.title}
              onClick={() => setSelectedImageModal(item.imageUrl)}
              className="size-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-102"
            />
            <div className="absolute top-3 left-3">
              <span
                className={cn(
                  "rounded-xl px-3 py-1 text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-xs",
                  item.isResolved
                    ? "bg-slate-900/80 text-slate-300"
                    : isLost
                    ? "bg-rose-600 text-white"
                    : "bg-emerald-600 text-white"
                )}
              >
                {item.isResolved ? "Resolved & Returned" : isLost ? "Lost Item" : "Found Item"}
              </span>
            </div>
            {item.reward && (
              <div className="absolute top-3 right-3">
                <span className="rounded-xl px-3 py-1 text-xs font-black bg-amber-500 text-slate-950 backdrop-blur-md shadow-xs flex items-center gap-1.5">
                  <Gift className="size-3.5" />
                  <span>Reward: {item.reward}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Status Alert if Resolved */}
        {item.isResolved && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5 shrink-0" />
            <div className="text-xs">
              <p className="font-bold">This item has been successfully resolved and returned!</p>
              <p className="opacity-80">Reunited through CampusLoop verified campus network.</p>
            </div>
          </div>
        )}

        {/* Title & Metadata Strip */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {!item.imageUrl && (
              <span
                className={cn(
                  "rounded-lg px-2.5 py-0.5 text-xs font-black uppercase tracking-wider border shadow-2xs",
                  item.isResolved
                    ? "bg-muted text-muted-foreground border-border/50"
                    : isLost
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                )}
              >
                {item.isResolved ? "Resolved" : isLost ? "Lost Item" : "Found Item"}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-lg bg-muted/60 text-muted-foreground border border-border/30 text-xs font-bold">
              {item.category}
            </span>
            {item.institution && (
              <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1">
                <School className="size-3" />
                <span>{item.institution.name}</span>
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
            {item.title}
          </h2>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-border/40 bg-card/60">
              <div className="size-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <MapPin className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Location on Campus
                </p>
                <p className="text-xs font-bold text-foreground truncate">{item.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl border border-border/40 bg-card/60">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Calendar className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Date Reported
                </p>
                <p className="text-xs font-bold text-foreground">
                  {item.itemDate || "Recently"} ({formatTimeAgo(item.createdAt)})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Item Description */}
        {item.description && (
          <div className="space-y-2 rounded-2xl border border-border/40 bg-card/40 p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Item Details &amp; Description
            </h3>
            <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {item.description}
            </p>
          </div>
        )}

        {/* Author / Reporter Trust Strip */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-card/60">
          <Link
            href={`/@${item.author.username}`}
            className="flex items-center gap-3 min-w-0 hover:opacity-85 transition-opacity"
          >
            <Avatar className="size-11 rounded-full border border-border/50 shrink-0">
              <AvatarImage src={avatar} />
              <AvatarFallback className="font-bold text-xs">
                {item.author.displayName[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-foreground truncate">
                  {item.author.displayName}
                </span>
                {(item.author.points || 0) >= 150 && (
                  <ShieldCheck className="size-3.5 text-primary shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                @{item.author.username} • {item.institution?.name?.split(",")[0] || "Campus Student"}
              </p>
            </div>
          </Link>

          <Link
            href={`/@${item.author.username}`}
            className="px-3 py-1.5 rounded-full border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
          >
            Profile
          </Link>
        </div>

        {/* Action Panel */}
        <div className="rounded-2xl border border-border/40 bg-muted/15 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-foreground">
                {isLost ? "Know where this item is?" : "Is this your item?"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Reach out securely to the student who reported this on campus.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!item.isResolved && (
                <Button
                  type="button"
                  onClick={handleContactOwner}
                  className={cn(
                    "flex-1 sm:flex-initial h-10 px-5 rounded-full font-black text-xs gap-1.5 shadow-md",
                    isLost
                      ? "bg-rose-600 hover:bg-rose-500 text-white"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  )}
                >
                  <MessageCircle className="size-4" />
                  <span>{isLost ? "I Found This!" : "Claim Item"}</span>
                </Button>
              )}

              {isOwner && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleResolve}
                  disabled={isUpdatingStatus}
                  className="h-10 px-4 rounded-full font-bold text-xs gap-1.5"
                >
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>{item.isResolved ? "Reopen" : "Mark Resolved"}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Smart Similarity Search & Potential Recovery Matches ─── */}
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500 animate-pulse" />
                <h3 className="text-sm font-black text-foreground tracking-tight">
                  Smart Similarity Matches &amp; Recovery
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground">
                CampusLoop scans student reports to cross-match similar items and counterpart reports.
              </p>
            </div>
          </div>

          {/* Potential Opposite-Type Matches (LOST ↔ FOUND) */}
          {potentialMatches.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
                <h4 className="text-xs font-black text-primary uppercase tracking-wider">
                  High-Probability Matches ({potentialMatches.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {potentialMatches.map((m) => (
                  <Link
                    key={m.id}
                    href={`/lost-and-found/${m.slug || m.id}`}
                    className="p-3.5 rounded-xl border border-border/40 bg-card hover:bg-muted/40 hover:border-primary/50 transition-all space-y-2 block"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] uppercase font-black",
                          m.type === "LOST" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                        )}
                      >
                        {m.type === "LOST" ? "Lost" : "Found"}
                      </span>
                      <span className="text-amber-500 text-[10px] font-bold">
                        {m.similarityScore * 10}% Match
                      </span>
                    </div>

                    <p className="text-xs font-black text-foreground line-clamp-1">{m.title}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3 text-rose-500" />
                      <span className="truncate">{m.location}</span>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Similar Items in Same Category / Reports */}
          {similarReports.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Other Similar Reports on Campus
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {similarReports.map((s) => (
                  <Link
                    key={s.id}
                    href={`/lost-and-found/${s.slug || s.id}`}
                    className="p-3 rounded-xl border border-border/30 bg-card/60 hover:bg-card hover:border-border transition-all block space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>{s.category}</span>
                      <span>{s.location}</span>
                    </div>
                    <p className="text-xs font-bold text-foreground line-clamp-1">{s.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {potentialMatches.length === 0 && similarReports.length === 0 && (
            <div className="p-4 rounded-2xl border border-border/30 bg-card/30 text-center space-y-1">
              <p className="text-xs font-bold text-muted-foreground">No matching items yet</p>
              <p className="text-[11px] text-muted-foreground/80">
                When someone reports a {isLost ? "found" : "lost"} item matching &quot;{item.category}&quot; or keywords in this description, it will automatically appear here!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Branded QR Modal */}
      <BrandedQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={item.title}
        subtitle={`${item.type === "LOST" ? "Lost" : "Found"} in ${item.location} • ${item.institution?.name || "Campus"}`}
        badgeText="Campus Recovery"
        shortUrl={`https://campusloop.space/lost-and-found/${item.slug || item.id}`}
        category="event"
      />

      {/* Image Lightbox Modal */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImageModal(null)}
        >
          <img
            src={selectedImageModal}
            alt="Enlarged view"
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
