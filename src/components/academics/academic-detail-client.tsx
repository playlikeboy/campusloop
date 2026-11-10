"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  FolderPlus,
  Layers,
  Share2,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AcademicAiStudyBar } from "@/components/academics/academic-ai-study-bar";
import { AcademicAuthBenefitsCard } from "@/components/academics/academic-auth-benefits-card";
import { AcademicAuthModal } from "@/components/academics/academic-auth-modal";
import { AcademicPdfViewer } from "@/components/academics/academic-pdf-viewer";
import { AddToPlaylistModal } from "@/components/academics/add-to-playlist-modal";
import { SimilarResourcesWidget } from "@/components/academics/similar-resources-widget";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerifiedSticker } from "@/components/ui/stickers";
import { useScrollIsolation } from "@/hooks/use-scroll-isolation";
import { checkAndRecordDownload, GUEST_DOWNLOAD_LIMIT } from "@/lib/academic-download-limiter";
import {
  trackAcademicDownload,
  trackAcademicLimitReached,
  trackAcademicShare,
  trackAcademicView,
  trackAcademicVote,
} from "@/lib/analytics/ga4";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo, getAvatarUrl } from "@/lib/utils";

interface AcademicDetailClientProps {
  initialResource: any;
  currentUserId?: string | null;
  canonicalUrl?: string;
}

export function AcademicDetailClient({
  initialResource,
  currentUserId,
  canonicalUrl,
}: AcademicDetailClientProps) {
  const router = useRouter();
  const [resource] = useState(initialResource);
  const effectivePageUrl =
    canonicalUrl ||
    `https://campusloop.space/academics/study-material/${initialResource.slug || initialResource.id}`;
  const [upvotes, setUpvotes] = useState(initialResource.upvotesCount || 0);
  const [downvotes, setDownvotes] = useState(initialResource.downvotesCount || 0);
  const [downloads, setDownloads] = useState(initialResource.downloadsCount || 0);
  const [views] = useState(initialResource.viewsCount || 1);
  const [userVote, setUserVote] = useState<"UP" | "DOWN" | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const scrollRef = useScrollIsolation<HTMLElement>();

  // Peer comments state
  const [comments, setComments] = useState<any[]>(initialResource.comments || []);
  const [commentText, setCommentText] = useState("");
  const [isHelpful, setIsHelpful] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Guest conversion modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<
    "SAVE" | "VOTE" | "COMMENT" | "UPLOAD" | "AI" | "DOWNLOAD_LIMIT"
  >("SAVE");

  const totalVotes = upvotes + downvotes;
  const helpfulPercent = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : null;
  const uploaderAvatar = getAvatarUrl(
    initialResource.uploader?.avatarUrl,
    initialResource.uploader?.username
  );

  // Track Academic Material View in GA4
  useEffect(() => {
    trackAcademicView({
      id: resource.id,
      title: resource.title,
      subjectCode: resource.subjectCode,
      subjectName: resource.subjectName,
      branch: resource.branch,
      semester: resource.semester,
      resourceType: resource.resourceType,
    });
  }, [resource]);

  // Handle peer voting with Loop Points feedback
  async function handleVote(action: "UP" | "DOWN") {
    if (!currentUserId) {
      setAuthModalReason("VOTE");
      setIsAuthModalOpen(true);
      return;
    }

    if (userVote === action) return;

    sounds.tap();
    haptics.medium();

    if (action === "UP") {
      setUpvotes((v: number) => v + 1);
      if (userVote === "DOWN") setDownvotes((v: number) => Math.max(0, v - 1));
      setUserVote("UP");
      trackAcademicVote(resource.id, "UP");
      toast.success("Thanks for voting");

      fetch(`/api/academics/${resource.id}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPVOTE" }),
      }).catch(() => {});
    } else {
      setDownvotes((v: number) => v + 1);
      if (userVote === "UP") setUpvotes((v: number) => Math.max(0, v - 1));
      setUserVote("DOWN");
      trackAcademicVote(resource.id, "DOWN");
      toast.info("Thanks. We'll take a look.");

      fetch(`/api/academics/${resource.id}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DOWNVOTE" }),
      }).catch(() => {});
    }
  }

  // Handle file open & download tracking
  function handleDownload() {
    const downloadCheck = checkAndRecordDownload(Boolean(currentUserId));
    if (!downloadCheck.allowed) {
      sounds.pop();
      haptics.error();
      trackAcademicLimitReached();
      setAuthModalReason("DOWNLOAD_LIMIT");
      setIsAuthModalOpen(true);
      toast.error(`You've used your ${GUEST_DOWNLOAD_LIMIT} free downloads. Sign in to download more.`);
      return;
    }

    sounds.tap();
    haptics.success();
    setDownloads((d: number) => d + 1);
    trackAcademicDownload(resource, !currentUserId, downloadCheck.count);

    fetch(`/api/academics/${resource.id}/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "DOWNLOAD" }),
    }).catch(() => {});

    const rawUrl = (resource.fileUrl || resource.driveUrl || "").trim();
    const driveFolderMatch = rawUrl.match(
      /(?:drive\.google\.com\/(?:drive\/(?:u\/\d+\/)?)?folders\/|embeddedfolderview\?id=)([a-zA-Z0-9_-]+)/i
    );
    const isDriveFolder = Boolean(driveFolderMatch);
    const cleanDriveFolderUrl = driveFolderMatch
      ? `https://drive.google.com/drive/folders/${driveFolderMatch[1]}`
      : rawUrl;

    const targetUrl = isDriveFolder ? cleanDriveFolderUrl : resource.fileUrl || resource.driveUrl;
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      if (isDriveFolder) {
        toast.success("Opening the Google Drive folder");
        return;
      }
      if (!currentUserId) {
        if (downloadCheck.remaining > 0) {
          toast.success(`Downloaded. ${downloadCheck.remaining} free downloads left.`);
        } else {
          toast.info("Downloaded. That was your last free download. Sign in to get more.");
        }
      }
    } else {
      toast.error("This file's link is broken right now. Try again later.");
    }
  }

  // Share note link
  function handleShare() {
    sounds.tap();
    haptics.light();
    const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
    trackAcademicShare(resource.id, resource.subjectCode, canNativeShare ? "share_api" : "clipboard");
    const url = window.location.href;
    if (canNativeShare) {
      navigator.share({
        title: resource.title,
        text: `Download ${resource.subjectCode} (${resource.subjectName}) study materials on CampusLoop:`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  }

  // Submit peer review
  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!currentUserId) {
      setAuthModalReason("COMMENT");
      setIsAuthModalOpen(true);
      return;
    }

    setIsSubmittingComment(true);
    sounds.tap();

    try {
      const res = await fetch(`/api/academics/${resource.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: commentText.trim(),
          isHelpful,
        }),
      });

      if (!res.ok) throw new Error("Failed to post comment");
      const json = (await res.json()) as { comment: any };

      setComments((prev) => [json.comment, ...prev]);
      setCommentText("");
      toast.success("Review posted. Thanks.");
      haptics.success();
    } catch {
      toast.error("Couldn't post your review. Try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-6 pb-24 text-foreground">
      {/* ─── Breadcrumb Navigation & Share Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/academics"
            onClick={() => sounds.tap()}
            className="inline-flex items-center gap-1.5 hover:text-foreground font-bold shrink-0 transition-colors group"
          >
            <div className="size-6 rounded-full bg-muted/60 group-hover:bg-muted flex items-center justify-center transition-colors">
              <ArrowLeft className="size-3" />
            </div>
            <span>Study material</span>
          </Link>
          <ChevronRight className="size-3 shrink-0 opacity-40" />
          <span className="truncate font-medium">{resource.branch}</span>
          <ChevronRight className="size-3 shrink-0 opacity-40 hidden sm:inline" />
          <span className="hidden sm:inline font-semibold text-foreground/80 shrink-0">
            Semester {resource.semester}
          </span>
          <ChevronRight className="size-3 shrink-0 opacity-40" />
          <span className="font-bold text-primary truncate">{resource.subjectCode}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!currentUserId) {
                setAuthModalReason("SAVE");
                setIsAuthModalOpen(true);
                return;
              }
              sounds.tap();
              haptics.light();
              setIsSaved(!isSaved);
              toast.success(isSaved ? "Removed from saved" : "Saved");
            }}
            className={cn(
              "flex size-11 items-center justify-center rounded-full border transition-ui cursor-pointer active:scale-95",
              isSaved
                ? "bg-brand-subtle text-brand-text border-brand-subtle-border"
                : "border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            title={isSaved ? "Saved" : "Save"}
            aria-label={isSaved ? "Remove from saved" : "Save"}
            aria-pressed={isSaved}
          >
            <AnimatedIcon
              icon={Bookmark}
              animation="lift"
              size={15}
              className={cn(isSaved && "fill-current")}
            />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex size-11 items-center justify-center rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-ui cursor-pointer active:scale-95"
            title="Share"
            aria-label="Share"
          >
            <AnimatedIcon icon={Share2} animation="pop" size={15} />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-ui cursor-pointer shadow-xs active:scale-95"
          >
            <Download className="size-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* ─── Resource Hero Header Card ─── */}
      <div className="relative rounded-2xl border border-border/40 bg-surface p-5 sm:p-7 overflow-hidden">
        {/* Subtle background ambient mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative flex flex-col gap-4">
          {/* Badge Chips Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-mono font-bold border border-primary/30">
              {resource.subjectCode}
            </span>
            <span className="text-xs font-bold text-foreground/90 bg-muted/60 px-3 py-1 rounded-full border border-border/30">
              {resource.subjectName}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/40">
              {resource.resourceType?.replace("_", " ") || "Notes"}
            </span>
            {helpfulPercent !== null && (
              <span className="ml-auto text-xs font-semibold text-fg-muted tabular-nums">
                {helpfulPercent}% of {totalVotes} {totalVotes === 1 ? "vote" : "votes"} helpful
              </span>
            )}
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight leading-snug">
              {resource.title}
            </h1>
            {resource.description && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-4xl">
                {resource.description}
              </p>
            )}
          </div>

          {/* Uploader & Fast Metrics Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/25">
            {/* Uploader info */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={`/@${resource.uploader?.username}?tab=academics`}
                className="shrink-0"
                tabIndex={-1}
                aria-hidden="true"
              >
                <Avatar className="size-10 rounded-full border border-border/50">
                  <AvatarImage src={uploaderAvatar} />
                  <AvatarFallback className="text-xs font-bold bg-muted">
                    {resource.uploader?.displayName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-tight">
                  <Link
                    href={`/@${resource.uploader?.username}?tab=academics`}
                    className="text-xs sm:text-sm font-bold text-foreground hover:underline truncate"
                  >
                    {resource.uploader?.displayName}
                  </Link>
                  {resource.isVerified && (
                    <VerifiedSticker size="sm" label="Checked" className="shrink-0 shadow-none" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  @{resource.uploader?.username} · {resource.institution?.name?.split(",")[0] || "Campus"} ·{" "}
                  {formatTimeAgo(resource.createdAt)}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ThumbsUp className="size-3.5 text-primary" />
                <strong className="text-foreground font-bold tabular-nums">{upvotes}</strong>
                <span className="hidden sm:inline">Helpful</span>
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="size-3.5 text-muted-foreground" />
                <strong className="text-foreground font-bold tabular-nums">{views}</strong>
                <span className="hidden sm:inline">Views</span>
              </span>
              <span className="flex items-center gap-1">
                <Download className="size-3.5 text-primary" />
                <strong className="text-foreground font-bold tabular-nums">{downloads}</strong>
                <span className="hidden sm:inline">Downloads</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 12-Column Responsive Workspace Grid (Full PC Utilization) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── Left Stage: Document Viewer & Discussion (8 cols) ─── */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* Interactive Document Previewer & Reader */}
          <AcademicPdfViewer
            fileUrl={resource.fileUrl}
            driveUrl={resource.driveUrl}
            attachments={resource.attachments}
            title={resource.title}
            subjectCode={resource.subjectCode}
            resourceType={resource.resourceType}
            department={resource.branch || undefined}
            semester={resource.semester || undefined}
            onDownload={handleDownload}
            pageUrl={effectivePageUrl}
            onOpenPlayer={(attachment) =>
              router.push(
                `/academics/study-material/${resource.id}/watch?a=${encodeURIComponent(attachment.id)}`
              )
            }
          />

          {/* Attached Files & Supplementary Links Tray (Multi-File Notes) */}
          {resource.attachments && Array.isArray(resource.attachments) && resource.attachments.length > 1 && (
            <div className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" />
                  <span>All Included Files &amp; Links ({resource.attachments.length})</span>
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  Switch in the reader above
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {resource.attachments.map((att: any, idx: number) => (
                  <div
                    key={att.id || idx}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-background/70 border border-border/30 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono font-bold text-muted-foreground">#{idx + 1}</span>
                      <span className="font-semibold text-foreground truncate">
                        {att.title || `Document ${idx + 1}`}
                      </span>
                      <span className="text-xs px-1.5 py-0.2 rounded bg-muted font-mono font-bold shrink-0">
                        {att.type || "PDF"}
                      </span>
                    </div>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0"
                    >
                      <span>Open</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study with AI Agents Bar */}
          <AcademicAiStudyBar
            title={resource.title}
            subjectCode={resource.subjectCode}
            courseCode={resource.courseCode || resource.subjectCode}
            department={resource.branch || undefined}
            semester={resource.semester || undefined}
            description={resource.description || undefined}
            materialUrl={effectivePageUrl}
            pageUrl={effectivePageUrl}
            collegeName={resource.institution?.name}
          />

          {/* Peer Reviews & Discussion Thread */}
          <div className="rounded-2xl border border-border/40 bg-card/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base text-fg">Reviews ({comments.length})</h2>
                <p className="text-sm text-fg-muted">Corrections, missing answers and exam tips</p>
              </div>
            </div>

            {/* Inline review form */}
            <form
              onSubmit={handleSubmitComment}
              className="flex items-start gap-3 py-3 border-y border-border/20"
            >
              <Avatar className="size-9 rounded-full border border-border/40 shrink-0 mt-0.5">
                <AvatarImage src={uploaderAvatar} />
                <AvatarFallback className="text-xs font-bold">You</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHelpful(true)}
                    className={cn(
                      "px-3 py-0.5 rounded-full text-xs font-bold transition-ui cursor-pointer flex items-center gap-1",
                      isHelpful
                        ? "bg-primary/10 text-primary border border-primary/25"
                        : "text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                  >
                    <CheckCircle2 className="size-3 text-primary" />
                    <span>Helpful</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHelpful(false)}
                    className={cn(
                      "px-3 py-0.5 rounded-full text-xs font-bold transition-ui cursor-pointer flex items-center gap-1",
                      !isHelpful
                        ? "bg-muted text-foreground border border-border/60"
                        : "text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                  >
                    <AlertTriangle className="size-3 text-muted-foreground" />
                    <span>Has mistakes</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a correction or exam tip"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 bg-muted/30 px-4 py-2 rounded-full text-xs text-foreground placeholder:text-muted-foreground border border-border/40 outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold disabled:opacity-40 hover:bg-primary/90 transition-ui cursor-pointer shrink-0 shadow-xs"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </form>

            {/* Comments list */}
            {comments.length === 0 ? (
              <div className="py-8 text-center space-y-1 text-muted-foreground">
                <p className="text-sm">No reviews yet. Spot a mistake or have a tip? Add it above.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {comments.map((c) => {
                  const commentAvatar = getAvatarUrl(c.author?.avatarUrl, c.author?.username);
                  return (
                    <div key={c.id} className="flex items-start gap-3 py-3 group">
                      <Avatar className="size-8 rounded-full border border-border/40 shrink-0">
                        <AvatarImage src={commentAvatar} />
                        <AvatarFallback className="text-xs font-bold">
                          {c.author?.displayName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="text-xs font-bold text-foreground">
                              {c.author?.displayName || "Student"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              @{c.author?.username} · {formatTimeAgo(c.createdAt)}
                            </span>
                          </div>

                          <span
                            className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-full border",
                              c.isHelpful
                                ? "bg-primary/10 text-primary border-primary/25"
                                : "bg-muted text-muted-foreground border-border/40"
                            )}
                          >
                            {c.isHelpful ? "VERIFIED ACCURATE" : "ERRATA NOTED"}
                          </span>
                        </div>

                        <p className="text-xs text-foreground/90 leading-relaxed">{c.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Stage: Intelligence Sidebar (4 cols - PC Space Utilization) ─── */}
        <aside
          ref={scrollRef}
          className="space-y-4 lg:col-span-4 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:pb-16 no-scrollbar"
        >
          <section className="space-y-3 rounded-lg border border-border bg-surface p-4" aria-label="Actions">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={userVote === "UP" ? "primary" : "outline"}
                aria-pressed={userVote === "UP"}
                onClick={() => handleVote("UP")}
              >
                <ArrowUp className="size-4" aria-hidden="true" />
                Helpful <span className="tabular-nums">({upvotes})</span>
              </Button>
              <Button
                variant={userVote === "DOWN" ? "secondary" : "outline"}
                aria-pressed={userVote === "DOWN"}
                onClick={() => handleVote("DOWN")}
                title="Mark as outdated or wrong"
              >
                <ArrowDown className="size-4" aria-hidden="true" />
                Has mistakes
              </Button>
            </div>
            <Button className="w-full" onClick={handleDownload}>
              <Download className="size-4" aria-hidden="true" />
              Download
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setIsAddToPlaylistOpen(true)}>
              <FolderPlus className="size-4" aria-hidden="true" />
              Save to playlist
            </Button>
          </section>

          {/* Curriculum & Specs Card */}
          <section
            className="space-y-2 rounded-lg border border-border bg-surface p-4"
            aria-labelledby="material-details-title"
          >
            <h2 id="material-details-title" className="font-sans text-sm font-semibold text-fg">
              Details
            </h2>

            <div className="divide-y divide-border/20 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Course code</span>
                <span className="font-mono font-bold text-foreground">{resource.subjectCode}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Subject</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">
                  {resource.subjectName}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Branch</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">
                  {resource.branch}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Semester</span>
                <span className="font-bold text-foreground">Semester {resource.semester}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-semibold text-foreground capitalize">
                  {resource.resourceType?.replace("_", " ")}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">College</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">
                  {resource.institution?.name?.split(",")[0] || "All India"}
                </span>
              </div>
            </div>
          </section>

          {/* Similar Resources Widget in Sidebar */}
          <SimilarResourcesWidget resourceId={resource.id} subjectCode={resource.subjectCode} />

          {/* Guest Student Auth Benefits */}
          {!currentUserId && (
            <AcademicAuthBenefitsCard returnTo={`/academics/study-material/${resource.id}`} />
          )}
        </aside>
      </div>

      {/* Add To Study Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isAddToPlaylistOpen}
        onClose={() => setIsAddToPlaylistOpen(false)}
        resourceId={resource.id}
        resourceTitle={resource.title}
      />

      {/* Guest Auth Modal */}
      <AcademicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        actionReason={authModalReason}
        returnTo={`/academics/study-material/${resource.id}`}
      />
    </div>
  );
}
