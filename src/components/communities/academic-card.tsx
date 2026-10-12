"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { checkAndRecordDownload } from "@/lib/academic-download-limiter";
import {
  trackAcademicDownload,
  trackAcademicLimitReached,
  trackAcademicShare,
} from "@/lib/analytics/ga4";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo, getAvatarUrl, getCollegeShortName } from "@/lib/utils";

export interface AcademicItemData {
  id: string;
  title: string;
  description?: string | null;
  subjectCode: string;
  subjectName: string;
  branch: string;
  semester: number;
  resourceType: string;
  moduleOrChapter?: string | null;
  fileUrl?: string | null;
  driveUrl?: string | null;
  tags?: any;
  upvotesCount: number;
  downvotesCount?: number;
  downloadsCount: number;
  viewsCount: number;
  isVerified: boolean;
  isSaved?: boolean;
  commentsCount?: number;
  recommendationReason?: string;
  personalizedScore?: number;
  createdAt: string | Date;
  uploader: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    points?: number | null;
  };
  institution?: { id: string; name: string; slug: string } | null;
}

interface AcademicCardProps {
  item: AcademicItemData;
  currentUserId?: string;
  isHighlighted?: boolean;
  variant?: "row" | "grid";
}

export function AcademicCard({ item, currentUserId, isHighlighted }: AcademicCardProps) {
  const router = useRouter();

  // Voting State
  const [upvotes, setUpvotes] = useState(item.upvotesCount || 0);
  const [downvotes, setDownvotes] = useState(item.downvotesCount || 0);
  const [userVote, setUserVote] = useState<"UP" | "DOWN" | null>(null);

  // Save State
  const [isSaved, setIsSaved] = useState(Boolean(item.isSaved));
  const [isSaving, setIsSaving] = useState(false);

  // Comments State
  const [showComments, setShowComments] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isHelpful, setIsHelpful] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Avatar URL
  const avatar = getAvatarUrl(item.uploader?.avatarUrl, item.uploader?.username);

  // Helpfulness reliability calculation
  const totalVotes = upvotes + downvotes;
  const reliability =
    totalVotes > 0
      ? Math.round((upvotes / totalVotes) * 100)
      : item.isVerified
        ? 98
        : 95;

  // Comments query
  const { data: commentsData, mutate: mutateComments } = useSWR<{ comments: any[] }>(
    showComments ? `/api/academics/${item.id}/comments` : null,
    fetcher
  );
  const commentsList = commentsData?.comments || [];

  // Card click navigation
  function handleCardClick() {
    sounds.tap();
    router.push(`/academics/${item.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Nested links and buttons keep their own keyboard behavior.
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  }

  // Voting Handler
  async function handleVote(e: React.MouseEvent, type: "UP" | "DOWN") {
    e.stopPropagation();
    sounds.tap();
    haptics.light();

    if (!currentUserId) {
      toast.info("Sign in with college email to upvote helpful notes!", {
        action: {
          label: "Sign In",
          onClick: () => {
            window.location.href = `/sign-in?returnTo=/academics/${item.id}`;
          },
        },
      });
      return;
    }

    if (type === "UP") {
      if (userVote === "UP") {
        setUpvotes((c) => Math.max(0, c - 1));
        setUserVote(null);
        fetch(`/api/academics/${item.id}/analytics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "UNDO_UPVOTE" }),
        }).catch(() => {});
      } else {
        if (userVote === "DOWN") setDownvotes((c) => Math.max(0, c - 1));
        setUpvotes((c) => c + 1);
        setUserVote("UP");
        toast.success("Marked as helpful!");
        fetch(`/api/academics/${item.id}/analytics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "UPVOTE" }),
        }).catch(() => {});
      }
    } else {
      if (userVote === "DOWN") {
        setDownvotes((c) => Math.max(0, c - 1));
        setUserVote(null);
        fetch(`/api/academics/${item.id}/analytics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "UNDO_DOWNVOTE" }),
        }).catch(() => {});
      } else {
        if (userVote === "UP") setUpvotes((c) => Math.max(0, c - 1));
        setDownvotes((c) => c + 1);
        setUserVote("DOWN");
        toast.info("Flagged notes reliability");
        fetch(`/api/academics/${item.id}/analytics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "DOWNVOTE" }),
        }).catch(() => {});
      }
    }
  }

  // Save / Bookmark Handler
  async function handleToggleSave(e: React.MouseEvent) {
    e.stopPropagation();
    sounds.tap();
    haptics.medium();

    if (!currentUserId) {
      toast.info("Sign in with college email to save to your cloud locker!", {
        action: {
          label: "Sign In",
          onClick: () => {
            window.location.href = `/sign-in?returnTo=/academics/${item.id}`;
          },
        },
      });
      return;
    }

    const nextState = !isSaved;
    setIsSaved(nextState);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/academics/${item.id}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextState ? "SAVE" : "UNSAVE" }),
      });
      if (res.ok) {
        toast.success(nextState ? "Saved to your study locker!" : "Removed from locker");
      } else {
        setIsSaved(!nextState);
        toast.error("Failed to update saved status");
      }
    } catch {
      setIsSaved(!nextState);
      toast.error("Network error saving resource");
    } finally {
      setIsSaving(false);
    }
  }

  // Download / Direct View Handler
  async function handleOpenResource(e: React.MouseEvent) {
    e.stopPropagation();
    const downloadCheck = checkAndRecordDownload(Boolean(currentUserId));
    if (!downloadCheck.allowed) {
      sounds.pop();
      haptics.error();
      trackAcademicLimitReached();
      toast.info("You've used all 5 free guest downloads! Sign in for unlimited access", {
        action: {
          label: "Sign In",
          onClick: () => {
            window.location.href = `/sign-in?returnTo=/academics/${item.id}`;
          },
        },
      });
      return;
    }

    sounds.tap();
    haptics.light();
    trackAcademicDownload(item, !currentUserId, downloadCheck.count);

    const rawUrl = (item.fileUrl || item.driveUrl || "").trim();
    const driveFolderMatch = rawUrl.match(
      /(?:drive\.google\.com\/(?:drive\/(?:u\/\d+\/)?)?folders\/|embeddedfolderview\?id=)([a-zA-Z0-9_-]+)/i
    );
    const isDriveFolder = Boolean(driveFolderMatch);
    const cleanDriveFolderUrl = driveFolderMatch
      ? `https://drive.google.com/drive/folders/${driveFolderMatch[1]}`
      : rawUrl;

    const targetUrl = isDriveFolder ? cleanDriveFolderUrl : item.fileUrl || item.driveUrl;
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(`/academics/${item.id}`);
    }

    try {
      await fetch(`/api/academics/${item.id}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DOWNLOAD" }),
      });
    } catch {}
  }

  // Share Handler
  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    sounds.tap();
    haptics.light();
    trackAcademicShare(item.id, item.subjectCode, "clipboard");

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://campusloop.space";
    const shareUrl = `${baseUrl}/academics/${item.id}`;

    if (navigator.share) {
      navigator
        .share({
          title: item.title,
          text: `Check out ${item.subjectCode}: ${item.subjectName} notes on CampusLoop!`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Resource link copied to clipboard!");
    }
  }

  // Comments submit
  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!currentUserId) {
      toast.info("Sign in to post comments!");
      return;
    }

    setIsSubmittingComment(true);
    sounds.send();
    haptics.medium();

    try {
      const res = await fetch(`/api/academics/${item.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentText.trim(), isHelpful }),
      });
      const data = (await res.json()) as { comment?: any; error?: string };
      if (res.ok && data.comment) {
        toast.success("Review posted!");
        setCommentText("");
        mutateComments();
      } else {
        toast.error(data.error || "Failed to post comment");
      }
    } catch {
      toast.error("Network error posting comment");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  const isDriveFolder = Boolean(
    (item.fileUrl || item.driveUrl || "").match(
      /(?:drive\.google\.com\/(?:drive\/(?:u\/\d+\/)?)?folders\/|embeddedfolderview\?id=)([a-zA-Z0-9_-]+)/i
    )
  );

  const formattedType =
    item.resourceType === "PYQ"
      ? "PYQ"
      : item.resourceType === "NOTES"
        ? "Notes"
        : item.resourceType === "CHEAT_SHEET"
          ? "Formula Sheet"
          : (item.resourceType || "Notes").replace("_", " ");

  return (
    <article
      id={`academic-${item.id}`}
      role="article"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative p-4 sm:p-5 transition-all duration-150 cursor-pointer select-none",
        "border-b border-border/25 hover:bg-muted/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isHighlighted && "bg-primary/5 ring-1 ring-primary/30"
      )}
    >
      <div className="space-y-2.5">
        {/* ── 1. Contributor Row: [Avatar] Contributor · time ... [Share] ── */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/@${item.uploader.username}?tab=academics`}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
              title={`View @${item.uploader.username}'s profile`}
            >
              <Avatar className="size-6.5 sm:size-7 rounded-full border border-border/40 hover:opacity-90 transition-opacity">
                <AvatarImage src={avatar} alt={item.uploader.displayName} />
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {item.uploader.displayName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex items-center gap-1.5 min-w-0 truncate text-[11px] sm:text-xs">
              <Link
                href={`/@${item.uploader.username}?tab=academics`}
                onClick={(e) => e.stopPropagation()}
                className="font-bold text-foreground hover:text-primary transition-colors truncate max-w-[130px] sm:max-w-[200px]"
              >
                {item.uploader.displayName}
              </Link>
              {(item.uploader.points || 0) >= 150 && (
                <VerifiedBadge size="sm" />
              )}
              <span className="text-muted-foreground/40 shrink-0">·</span>
              <span className="text-muted-foreground truncate max-w-[130px] sm:max-w-[220px]">
                {getCollegeShortName(item.institution) || "Campus"}
              </span>
              <span className="text-muted-foreground/40 shrink-0">·</span>
              <span className="text-muted-foreground/70 shrink-0 text-[10px] tabular-nums">
                {formatTimeAgo(item.createdAt)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="flex size-7.5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
            title="Share resource"
            aria-label="Share resource"
          >
            <Share2 className="size-3.5" />
          </button>
        </div>

        {/* ── 2. Academic Context Lines: Course Code · Subject / Sem · Branch · Type ── */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap text-xs sm:text-[13px]">
            <span className="font-mono font-bold text-primary tracking-tight">
              {item.subjectCode}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-semibold text-foreground/90 truncate max-w-[280px] sm:max-w-[420px]">
              {item.subjectName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-xs text-muted-foreground">
            <span>Sem {item.semester}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{item.branch}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-medium text-foreground/80">{formattedType}</span>
            {item.moduleOrChapter && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-amber-500 font-medium truncate max-w-[140px]">
                  {item.moduleOrChapter}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── 3. Document Title ── */}
        <div className="pt-0.5">
          <h2 className="text-[15px] sm:text-[16.5px] font-bold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </h2>
        </div>

        {/* Keep long descriptions available without crowding every card by default. */}
        {item.description && (
          <div className="pt-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDescription((current) => !current);
              }}
              aria-expanded={showDescription}
              aria-controls={"academic-description-" + item.id}
              className="inline-flex min-h-7 items-center gap-1 rounded-md pr-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {showDescription ? "Hide details" : "Details"}
              <ChevronDown
                className={cn("size-3.5 transition-transform duration-200", showDescription && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            {showDescription && (
              <p
                id={"academic-description-" + item.id}
                className="pt-1 text-xs sm:text-[13px] leading-relaxed text-muted-foreground/80 whitespace-pre-line"
              >
                {item.description}
              </p>
            )}
          </div>
        )}

        {/* ── 5. Quality & Verification: ✓ Verified · 98% helpful ── */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[11px]">
          {item.isVerified && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-500 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              <span>Verified</span>
            </span>
          )}
          {item.isVerified && <span className="text-muted-foreground/40">·</span>}
          <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
            <span>{reliability}% helpful</span>
          </span>
        </div>

        {/* ── 6. Footer Actions: [↑ 76 ↓] [💬 4] ... [Save] [View →] ── */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/15 text-xs text-muted-foreground w-full">
          {/* Left: Voting & Comments */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Vote Group */}
            <div className="inline-flex items-center rounded-xl bg-muted/30 border border-border/30 p-0.5 text-xs">
              <button
                type="button"
                onClick={(e) => handleVote(e, "UP")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg hover:text-primary transition-colors cursor-pointer",
                  userVote === "UP" && "text-primary font-bold bg-primary/10"
                )}
                title="Upvote"
                aria-label="Upvote this resource"
              >
                <ArrowUp className={cn("size-3.5", userVote === "UP" && "stroke-[2.5]")} />
                <span className="tabular-nums font-semibold text-[11px]">{upvotes}</span>
              </button>
              <div className="h-3 w-px bg-border/40 mx-0.5" />
              <button
                type="button"
                onClick={(e) => handleVote(e, "DOWN")}
                className={cn(
                  "p-1 rounded-lg hover:text-rose-400 transition-colors cursor-pointer",
                  userVote === "DOWN" && "text-rose-400 bg-rose-500/10"
                )}
                title="Report issue"
                aria-label="Report issue with resource"
              >
                <ArrowDown className="size-3.5" />
              </button>
            </div>

            {/* Comments Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border/30 text-xs"
              title="Discussion & comments"
              aria-label="Comments"
            >
              <MessageSquare className="size-3.5" />
              <span className="tabular-nums font-semibold text-[11px]">
                {commentsList.length || item.commentsCount || 0}
              </span>
            </button>
          </div>

          {/* Right: Save & View Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Save Button */}
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={isSaving}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border",
                isSaved
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                  : "border-border/40 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
              )}
              title={isSaved ? "Saved to locker" : "Save to semester locker"}
              aria-label="Save to semester locker"
            >
              <Bookmark className={cn("size-3.5", isSaved && "fill-current")} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>

            {/* View / Open Resource */}
            <button
              type="button"
              onClick={handleOpenResource}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all cursor-pointer border border-primary/20 hover:border-primary/40"
              title="Open document"
              aria-label="Open document"
            >
              <span>{isDriveFolder ? "Folder" : "View"}</span>
              {isDriveFolder ? (
                <ExternalLink className="size-3" />
              ) : (
                <ArrowRight className="size-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Expandable Peer Reviews & Reliability Comments ─── */}
      {showComments && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 border-t border-border/20 pt-3 space-y-3 animate-in fade-in duration-150"
        >
          {/* Comment Composer */}
          <form onSubmit={handleSubmitComment} className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">Material verification review:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsHelpful(true)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1",
                    isHelpful
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CheckCircle2 className="size-2.5 shrink-0" />
                  <span>Accurate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsHelpful(false)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1",
                    !isHelpful
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <AlertTriangle className="size-2.5 shrink-0" />
                  <span>Errata Notice</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Post your verification or exam feedback..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-muted/30 px-3.5 py-1.5 rounded-full text-xs text-foreground placeholder:text-muted-foreground/60 border border-border/30 outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold disabled:opacity-40 hover:opacity-90 transition-all cursor-pointer shrink-0 shadow-2xs"
              >
                Post
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar divide-y divide-border/15">
            {commentsList.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic py-1 text-center">
                No peer reviews yet. Be the first to verify!
              </p>
            ) : (
              commentsList.map((c: any) => (
                <div key={c.id} className="pt-2 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <span>{c.author?.displayName || "Student"}</span>
                      {c.author?.username && (
                        <span className="text-[10px] text-muted-foreground font-normal">
                          @{c.author.username}
                        </span>
                      )}
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-[10px] text-muted-foreground/75 font-normal">
                        {formatTimeAgo(c.createdAt)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-black px-1.5 py-0.2 rounded-full",
                        c.isHelpful ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                      )}
                    >
                      {c.isHelpful ? "Accurate" : "Errata"}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 font-normal leading-relaxed">{c.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
}
