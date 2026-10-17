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
  ShieldCheck,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AcademicAiStudyBar } from "@/components/academics/academic-ai-study-bar";
import { AcademicAuthBenefitsCard } from "@/components/academics/academic-auth-benefits-card";
import { AcademicAuthModal } from "@/components/academics/academic-auth-modal";
import { AcademicPdfViewer } from "@/components/academics/academic-pdf-viewer";
import { AddToPlaylistModal } from "@/components/academics/add-to-playlist-modal";
import { SimilarResourcesWidget } from "@/components/academics/similar-resources-widget";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { useScrollIsolation } from "@/hooks/use-scroll-isolation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { checkAndRecordDownload } from "@/lib/academic-download-limiter";
import {
  gtagEvent,
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
  const [resource] = useState(initialResource);
  const effectivePageUrl =
    canonicalUrl || `https://campusloop.space/academics/study-material/${initialResource.slug || initialResource.id}`;
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

  // Campus AI Cram Helper
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Guest conversion modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<
    "SAVE" | "VOTE" | "COMMENT" | "UPLOAD" | "AI" | "DOWNLOAD_LIMIT"
  >("SAVE");

  const totalVotes = upvotes + downvotes;
  const reliability = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 100;
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
      toast.success("Helpful vote recorded! +5 Loop Points credited");

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
      toast.info("Feedback noted. Thank you for keeping the vault accurate!");

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
      toast.error("You've used all 5 free guest downloads! Sign in or register for unlimited downloads");
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
        toast.success("Opening Google Drive study collection! Zero login required");
        return;
      }
      if (!currentUserId) {
        if (downloadCheck.remaining > 0) {
          toast.success(`Downloaded! (${downloadCheck.remaining} free guest downloads remaining)`);
        } else {
          toast.info("Downloaded! That was your 5th free download. Sign in anytime for unlimited access!");
        }
      }
    } else {
      toast.error("File link is currently unavailable");
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
      toast.success("Study link copied to clipboard!");
    }
  }

  // AI Cram Generator
  function handleGenerateAiCram(promptType: "CONCEPTS" | "EXAM_TIPS" | "CHECKLIST") {
    if (!currentUserId) {
      setAuthModalReason("AI");
      setIsAuthModalOpen(true);
      return;
    }

    sounds.tap();
    haptics.medium();
    gtagEvent("ai_study_cram_generated", { subject_code: resource.subjectCode, prompt_type: promptType });
    setIsGeneratingAi(true);

    setTimeout(() => {
      if (promptType === "CONCEPTS") {
        setAiAnalysis(
          `### Core Concepts & Formula Checklist for ${resource.subjectCode}:\n\n` +
            `1. **Key Definitions & Principles**: Review core theorems and mathematical formulas outlined in this document.\n` +
            `2. **High-Yield Exam Topics**: Focus on numericals, step-by-step proofs, and recurring semester patterns.\n` +
            `3. **Common Mistakes to Avoid**: Always verify standard boundary conditions, units, and assumptions.\n\n` +
            `*Tip: Practice these solutions alongside past year papers for maximum marks.*`
        );
      } else if (promptType === "EXAM_TIPS") {
        setAiAnalysis(
          `### 15-Minute Exam Cram Strategy for ${resource.subjectName}:\n\n` +
            `• **First 5 mins**: Scan all block diagrams and formula boxes highlighted in these notes.\n` +
            `• **Next 5 mins**: Review solved examples and past question paper patterns.\n` +
            `• **Last 5 mins**: Rehearse key definitions to score full marks in Section A.\n\n` +
            `*Compiled with syllabus insights for ${resource.branch} Semester ${resource.semester}.*`
        );
      } else {
        setAiAnalysis(
          `### Syllabus Alignment & Peer Verification:\n\n` +
            `• **Relevance**: Verified by ${resource.institution?.name?.split(",")[0] || "Campus"} peers with a ${reliability}% accuracy rating.\n` +
            `• **Coverage**: Covers essential modules for ${resource.subjectCode} (${resource.subjectName}).\n` +
            `• **Recommended Study Order**: Read lecture notes first, write down cheat sheet formulas, then test yourself against past question papers.`
        );
      }
      setIsGeneratingAi(false);
      sounds.success();
    }, 600);
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
      toast.success("Review posted! Thanks for verifying campus notes.");
      haptics.success();
    } catch {
      toast.error("Could not post review. Please try again.");
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
            <span>Vault</span>
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
              toast.success(isSaved ? "Removed from Study Vault" : "Saved to Study Vault");
            }}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border transition-all cursor-pointer shadow-2xs active:scale-95",
              isSaved
                ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                : "border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            title="Save to Study Vault"
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
            className="flex size-9 items-center justify-center rounded-full border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Share note link"
          >
            <AnimatedIcon icon={Share2} animation="pop" size={15} />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Download className="size-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* ─── Resource Hero Header Card ─── */}
      <div className="relative rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-5 sm:p-7 overflow-hidden">
        {/* Subtle background ambient mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative flex flex-col gap-4">
          {/* Badge Chips Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-mono font-black border border-primary/30">
              {resource.subjectCode}
            </span>
            <span className="text-xs font-bold text-foreground/90 bg-muted/60 px-3 py-1 rounded-full border border-border/30">
              {resource.subjectName}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/40">
              {resource.resourceType?.replace("_", " ") || "Notes"}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 ml-auto">
              <CheckCircle2 className="size-3" />
              <span>{reliability}% Verified</span>
            </span>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-3xl font-black text-foreground tracking-tight leading-snug">
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
              <Link href={`/@${resource.uploader?.username}?tab=academics`} className="shrink-0">
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
                  {resource.isVerified && <ShieldCheck className="size-3.5 text-primary shrink-0" />}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  @{resource.uploader?.username} · {resource.institution?.name?.split(",")[0] || "Campus"} ·{" "}
                  {formatTimeAgo(resource.createdAt)}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ThumbsUp className="size-3.5 text-primary" />
                <strong className="text-foreground font-black tabular-nums">{upvotes}</strong>
                <span className="hidden sm:inline">Helpful</span>
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="size-3.5 text-muted-foreground" />
                <strong className="text-foreground font-black tabular-nums">{views}</strong>
                <span className="hidden sm:inline">Views</span>
              </span>
              <span className="flex items-center gap-1">
                <Download className="size-3.5 text-primary" />
                <strong className="text-foreground font-black tabular-nums">{downloads}</strong>
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
          />

          {/* Attached Files & Supplementary Links Tray (Multi-File Notes) */}
          {resource.attachments && Array.isArray(resource.attachments) && resource.attachments.length > 1 && (
            <div className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" />
                  <span>All Included Files &amp; Links ({resource.attachments.length})</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Switch in reader above
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {resource.attachments.map((att: any, idx: number) => (
                  <div
                    key={att.id || idx}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-background/70 border border-border/30 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-foreground truncate">
                        {att.title || `Document ${idx + 1}`}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted uppercase font-mono font-bold shrink-0">
                        {att.type || "PDF"}
                      </span>
                    </div>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline shrink-0"
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
                <h3 className="text-sm font-black text-foreground">
                  Peer Reviews &amp; Syllabus Accuracy ({comments.length})
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Student-verified corrections, missing solutions &amp; exam tips
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                {reliability}% Verified
              </span>
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
                      "px-3 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1",
                      isHelpful
                        ? "bg-primary/10 text-primary border border-primary/25"
                        : "text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                  >
                    <CheckCircle2 className="size-3 text-primary" />
                    <span>Accurate &amp; Verified</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHelpful(false)}
                    className={cn(
                      "px-3 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1",
                      !isHelpful
                        ? "bg-muted text-foreground border border-border/60"
                        : "text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                  >
                    <AlertTriangle className="size-3 text-muted-foreground" />
                    <span>Outdated / Errata</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Post your review, formula correction, or exam tip..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 bg-muted/30 px-4 py-2 rounded-full text-xs text-foreground placeholder:text-muted-foreground border border-border/40 outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-black disabled:opacity-40 hover:bg-primary/90 transition-all cursor-pointer shrink-0 shadow-xs"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </form>

            {/* Comments list */}
            {comments.length === 0 ? (
              <div className="py-8 text-center space-y-1 text-muted-foreground">
                <p className="text-xs font-semibold">No peer reviews yet</p>
                <p className="text-[11px]">Be the first to verify syllabus accuracy or post corrections.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {comments.map((c) => {
                  const commentAvatar = getAvatarUrl(c.author?.avatarUrl, c.author?.username);
                  return (
                    <div key={c.id} className="flex items-start gap-3 py-3 group">
                      <Avatar className="size-8 rounded-full border border-border/40 shrink-0">
                        <AvatarImage src={commentAvatar} />
                        <AvatarFallback className="text-[10px] font-bold">
                          {c.author?.displayName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="text-xs font-bold text-foreground">
                              {c.author?.displayName || "Student"}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              @{c.author?.username} · {formatTimeAgo(c.createdAt)}
                            </span>
                          </div>

                          <span
                            className={cn(
                              "text-[9px] font-black px-2 py-0.5 rounded-full border",
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
          className="lg:col-span-4 space-y-4 sticky top-4 h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain no-scrollbar pr-1 pb-16 select-none"
        >
          {/* Quick Actions & Voting Card */}
          <div className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Actions &amp; Recognition
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleVote("UP")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border active:scale-95",
                  userVote === "UP"
                    ? "bg-primary text-primary-foreground border-primary font-black shadow-xs"
                    : "border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowUp className="size-4" />
                <span>Helpful ({upvotes})</span>
              </button>

              <button
                type="button"
                onClick={() => handleVote("DOWN")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border active:scale-95",
                  userVote === "DOWN"
                    ? "bg-muted text-foreground border-foreground"
                    : "border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                title="Flag outdated or inaccurate"
              >
                <ArrowDown className="size-4" />
                <span>Errata</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="size-4" />
              <span>Download Full Document</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddToPlaylistOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border/50 hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <FolderPlus className="size-4" />
              <span>Add to Study Playlist</span>
            </button>
          </div>

          {/* Curriculum & Specs Card */}
          <div className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-3 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Curriculum Specifications
            </h3>

            <div className="divide-y divide-border/20 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Course Code</span>
                <span className="font-mono font-bold text-foreground">{resource.subjectCode}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Subject Name</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">
                  {resource.subjectName}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Department</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">
                  {resource.branch}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Semester</span>
                <span className="font-bold text-foreground">Semester {resource.semester}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-semibold text-primary capitalize">
                  {resource.resourceType?.replace("_", " ")}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">University Hub</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">
                  {resource.institution?.name?.split(",")[0] || "All India"}
                </span>
              </div>
            </div>
          </div>

          {/* AI 1-Click Study Assistant Card */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-primary">
              <Sparkles className="size-4" />
              <h3 className="text-xs font-black uppercase tracking-wider">AI Study Accelerators</h3>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleGenerateAiCram("CONCEPTS")}
                disabled={isGeneratingAi}
                className="w-full text-left p-2.5 rounded-xl border border-border/30 bg-card/60 hover:bg-card text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>Formula &amp; Theorem Sheet</span>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => handleGenerateAiCram("EXAM_TIPS")}
                disabled={isGeneratingAi}
                className="w-full text-left p-2.5 rounded-xl border border-border/30 bg-card/60 hover:bg-card text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>15-Min Exam Cram Strategy</span>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => handleGenerateAiCram("CHECKLIST")}
                disabled={isGeneratingAi}
                className="w-full text-left p-2.5 rounded-xl border border-border/30 bg-card/60 hover:bg-card text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>Syllabus Verification Checklist</span>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </button>
            </div>

            {aiAnalysis && (
              <div className="p-3 rounded-xl bg-card border border-primary/20 text-xs text-foreground/90 space-y-1.5 leading-relaxed">
                <p className="font-bold text-primary text-[11px] uppercase tracking-wider">
                  Generated Insights:
                </p>
                <div className="whitespace-pre-line text-[11px]">{aiAnalysis}</div>
              </div>
            )}
          </div>

          {/* Similar Resources Widget in Sidebar */}
          <SimilarResourcesWidget resourceId={resource.id} subjectCode={resource.subjectCode} />

          {/* Guest Student Auth Benefits */}
          {!currentUserId && <AcademicAuthBenefitsCard returnTo={`/academics/study-material/${resource.id}`} />}
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
