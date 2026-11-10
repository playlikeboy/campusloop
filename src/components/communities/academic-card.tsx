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
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { checkAndRecordDownload } from "@/lib/academic-download-limiter";
import { trackAcademicDownload, trackAcademicLimitReached, trackAcademicShare } from "@/lib/analytics/ga4";
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
  isTrending?: boolean;
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

  // Report community usefulness only when votes exist; never invent a score.
  const totalVotes = upvotes + downvotes;
  const reliability = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : null;

  // Comments query
  const { data: commentsData, mutate: mutateComments } = useSWR<{ comments: any[] }>(
    showComments ? `/api/academics/${item.id}/comments` : null,
    fetcher
  );
  const commentsList = commentsData?.comments || [];

  // Card click navigation
  function handleCardClick() {
    sounds.tap();
    router.push(`/academics/study-material/${item.id}`);
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
      toast.info("Sign in to upvote notes", {
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
        toast.success("Marked as helpful");
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
      toast.info("Sign in to save notes", {
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
        toast.success(nextState ? "Saved" : "Removed from saved");
      } else {
        setIsSaved(!nextState);
        toast.error("Couldn't save. Try again.");
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
      router.push(`/academics/study-material/${item.id}`);
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
      toast.success("Link copied");
    }
  }

  // Comments submit
  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!currentUserId) {
      toast.info("Sign in to comment");
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
        toast.success("Comment posted");
        setCommentText("");
        mutateComments();
      } else {
        toast.error(data.error || "Couldn't post your review. Try again.");
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
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the whole card opens the resource, so it takes focus and Enter
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative p-4 sm:p-5 transition-colors duration-150 cursor-pointer",
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
                <AvatarFallback className="text-xs font-semibold">
                  {item.uploader.displayName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex items-center gap-1.5 min-w-0 truncate text-xs sm:text-xs">
              <Link
                href={`/@${item.uploader.username}?tab=academics`}
                onClick={(e) => e.stopPropagation()}
                className="font-bold text-foreground hover:text-primary transition-colors truncate max-w-[130px] sm:max-w-[200px]"
              >
                {item.uploader.displayName}
              </Link>
              <span className="text-muted-foreground/40 shrink-0">·</span>
              <span className="text-muted-foreground truncate max-w-[130px] sm:max-w-[220px]">
                {getCollegeShortName(item.institution) || "Campus"}
              </span>
              <span className="text-muted-foreground/40 shrink-0">·</span>
              <span className="text-muted-foreground/70 shrink-0 text-xs tabular-nums">
                {formatTimeAgo(item.createdAt)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleShare}
            aria-label="Share resource"
            className="shrink-0"
          >
            <Share2 />
          </Button>
        </div>

        {/* ── 2. Academic Context Lines: Course Code · Subject / Sem · Branch · Type ── */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-fg">{item.subjectCode}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-semibold text-foreground/90 truncate max-w-[280px] sm:max-w-[420px]">
              {item.subjectName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-xs text-muted-foreground">
            <span>Sem {item.semester}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{item.branch}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-medium text-foreground/80">{formattedType}</span>
            {item.moduleOrChapter && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="max-w-[140px] truncate font-medium">{item.moduleOrChapter}</span>
              </>
            )}
          </div>
        </div>

        {/* ── 3. Document Title ── */}
        <div className="pt-0.5">
          <h2 className="line-clamp-2 text-base leading-snug font-semibold text-fg">{item.title}</h2>
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
              aria-controls={`academic-description-${item.id}`}
              className="inline-flex min-h-11 items-center gap-1 rounded-md pr-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {showDescription ? "Hide details" : "Details"}
              <ChevronDown
                className={cn("size-3.5 transition-transform duration-200", showDescription && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            {showDescription && (
              <p
                id={`academic-description-${item.id}`}
                className="pt-1 text-sm leading-relaxed text-fg-muted whitespace-pre-line"
              >
                {item.description}
              </p>
            )}
          </div>
        )}

        {/* ── 5. Quality & Community Feedback ── */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs">
          {item.isTrending && (
            <span className="inline-flex items-center gap-1 font-semibold text-warning">
              <TrendingUp className="size-3.5" />
              <span>Trending</span>
            </span>
          )}
          {item.isVerified && (
            <span className="inline-flex items-center gap-1 font-semibold text-success">
              <CheckCircle2 className="size-3.5" />
              <span>Verified</span>
            </span>
          )}
          {reliability !== null && (
            <>
              {item.isVerified && <span className="text-muted-foreground/40">·</span>}
              <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                <span>{reliability}% found helpful</span>
              </span>
            </>
          )}
          {reliability === null && !item.isVerified && (
            <span className="font-medium text-muted-foreground">No reviews yet</span>
          )}
        </div>

        {/* Footer: votes, comments, save and open */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/15 text-xs text-muted-foreground w-full">
          {/* Left: Voting & Comments */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="inline-flex items-center rounded-full bg-surface-muted">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => handleVote(e, "UP")}
                aria-pressed={userVote === "UP"}
                aria-label={`Helpful, ${upvotes} votes`}
                className={cn("min-h-11", userVote === "UP" && "text-brand-text")}
              >
                <ArrowUp />
                <span className="tabular-nums">{upvotes}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => handleVote(e, "DOWN")}
                aria-pressed={userVote === "DOWN"}
                aria-label="Not helpful"
                className={cn(userVote === "DOWN" && "text-danger")}
              >
                <ArrowDown />
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
              aria-expanded={showComments}
              aria-label={`Reviews, ${commentsList.length || item.commentsCount || 0}`}
              className="min-h-11"
            >
              <MessageSquare />
              <span className="tabular-nums">{commentsList.length || item.commentsCount || 0}</span>
            </Button>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleToggleSave}
              disabled={isSaving}
              aria-pressed={isSaved}
              aria-label={isSaved ? "Saved" : "Save"}
              className={cn(isSaved && "text-brand-text")}
            >
              <Bookmark className={cn(isSaved && "fill-current")} />
            </Button>

            <Button type="button" variant="secondary" onClick={handleOpenResource}>
              {isDriveFolder ? "Open folder" : "Open"}
              {isDriveFolder ? <ExternalLink /> : <ArrowRight />}
            </Button>
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
            <fieldset className="flex flex-wrap items-center gap-2">
              <legend className="sr-only">Is this material accurate?</legend>
              <Chip
                size="sm"
                selected={isHelpful}
                onSelectedChange={() => setIsHelpful(true)}
                icon={<CheckCircle2 />}
              >
                Accurate
              </Chip>
              <Chip
                size="sm"
                selected={!isHelpful}
                onSelectedChange={() => setIsHelpful(false)}
                icon={<AlertTriangle />}
              >
                Has mistakes
              </Chip>
            </fieldset>

            <div className="flex items-center gap-2">
              <Input
                aria-label="Your review"
                placeholder="Was it useful for your exam?"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                loading={isSubmittingComment}
                disabled={!commentText.trim()}
                className="shrink-0"
              >
                Post
              </Button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar divide-y divide-border/15">
            {commentsList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-1 text-center">
                No peer reviews yet. Be the first to verify!
              </p>
            ) : (
              commentsList.map((c: any) => (
                <div key={c.id} className="pt-2 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <span>{c.author?.displayName || "Student"}</span>
                      {c.author?.username && (
                        <span className="text-xs text-muted-foreground font-normal">
                          @{c.author.username}
                        </span>
                      )}
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-xs text-muted-foreground/75 font-normal">
                        {formatTimeAgo(c.createdAt)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-bold px-1.5 py-0.2 rounded-full",
                        c.isHelpful ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"
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
