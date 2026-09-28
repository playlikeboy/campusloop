"use client";

import confetti from "canvas-confetti";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Image as ImageIcon,
  Loader2,
  PenTool,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { NovelMarkdownEditor } from "@/components/articles/novel-markdown-editor";
import { MarkdownContent } from "@/components/common/markdown-content";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ARTICLE_CATEGORY_LIST,
  ARTICLES_CANONICAL_HOST,
  getCategoryMeta,
} from "@/constants/articles";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadImageToImgBB } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface ArticleEditorClientProps {
  initialArticle?: {
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    content: string;
    coverImageUrl?: string | null;
    category?: string | null;
    tags?: string[] | null;
    status?: string | null;
  };
  currentProfile?: any | null;
  isEditing?: boolean;
}

const SUGGESTED_TAGS = [
  "placements",
  "internships",
  "dsa",
  "webdev",
  "campuslife",
  "research",
  "interview",
  "opensource",
];

export function ArticleEditorClient({
  initialArticle,
  currentProfile,
  isEditing = false,
}: ArticleEditorClientProps) {
  const router = useRouter();

  // Core article fields
  const [articleId, setArticleId] = useState<string | null>(initialArticle?.id || null);
  const [slug, setSlug] = useState<string | null>(initialArticle?.slug || null);
  const [title, setTitle] = useState(initialArticle?.title || "");
  const [subtitle, setSubtitle] = useState(initialArticle?.subtitle || "");
  const [content, setContent] = useState(initialArticle?.content || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialArticle?.coverImageUrl || "");
  const [category, setCategory] = useState(initialArticle?.category || "GENERAL");
  const [tags, setTags] = useState<string[]>(initialArticle?.tags || []);
  const [tagInput, setTagInput] = useState("");

  // Editor mode & drawer
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autosave status state
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const isDirtyRef = useRef(false);

  // Cover image uploading
  const coverImageInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Load draft from localStorage if creating brand new article and no initial article
  useEffect(() => {
    if (!isEditing && !initialArticle) {
      const saved = localStorage.getItem("campusloop_article_draft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.subtitle) setSubtitle(parsed.subtitle);
          if (parsed.content) setContent(parsed.content);
          if (parsed.coverImageUrl) setCoverImageUrl(parsed.coverImageUrl);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.tags) setTags(parsed.tags);
          if (parsed.slug) setSlug(parsed.slug);
          if (parsed.articleId) setArticleId(parsed.articleId);
        } catch {
          // ignore
        }
      }
    }
  }, [isEditing, initialArticle]);

  // Mark dirty whenever user edits
  function handleTitleChange(val: string) {
    setTitle(val);
    isDirtyRef.current = true;
    setSaveStatus("unsaved");
  }

  function handleSubtitleChange(val: string) {
    setSubtitle(val);
    isDirtyRef.current = true;
    setSaveStatus("unsaved");
  }

  function handleContentChange(val: string) {
    setContent(val);
    isDirtyRef.current = true;
    setSaveStatus("unsaved");
  }

  // Server-side debounced autosave (every 2.5s)
  const saveDraftToServer = useCallback(async () => {
    if (!title.trim() && !content.trim()) return;
    if (!isDirtyRef.current) return;

    setSaveStatus("saving");

    try {
      // If we already have a slug/articleId, update existing draft; else create new draft
      const isExisting = Boolean(slug);
      const endpoint = isExisting ? `/api/articles/${slug}` : "/api/articles";
      const method = isExisting ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled Draft",
          subtitle: subtitle.trim() || null,
          content: content.trim() || "...",
          coverImageUrl: coverImageUrl || null,
          category,
          tags,
          status: "DRAFT",
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.article) {
        if (!slug && data.article.slug) setSlug(data.article.slug);
        if (!articleId && data.article.id) setArticleId(data.article.id);
      }

      // Also persist to localStorage
      localStorage.setItem(
        "campusloop_article_draft",
        JSON.stringify({
          articleId: data.article?.id || articleId,
          slug: data.article?.slug || slug,
          title,
          subtitle,
          content,
          coverImageUrl,
          category,
          tags,
        })
      );

      isDirtyRef.current = false;
      setSaveStatus("saved");
      setLastSavedTime(new Date());
    } catch (err) {
      console.warn("Autosave error:", err);
      setSaveStatus("error");
    }
  }, [title, subtitle, content, coverImageUrl, category, tags, slug, articleId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isDirtyRef.current && (title.trim() || content.trim())) {
        void saveDraftToServer();
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [title, subtitle, content, coverImageUrl, category, tags, saveDraftToServer]);

  // Unsaved changes browser prompt
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  async function handleCoverUpload(file: File) {
    if (!file) return;
    setIsUploadingCover(true);
    const toastId = toast.loading("Uploading cover image...");

    try {
      const { displayUrl } = await uploadImageToImgBB(file);
      setCoverImageUrl(displayUrl);
      isDirtyRef.current = true;
      setSaveStatus("unsaved");
      toast.success("Cover image uploaded", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cover upload failed", { id: toastId });
    } finally {
      setIsUploadingCover(false);
      if (coverImageInputRef.current) coverImageInputRef.current.value = "";
    }
  }

  function generateArtworkCover() {
    const styles = ["shapes", "identicon", "lorelei"];
    const selectedStyle = styles[Math.floor(Math.random() * styles.length)];
    const seed = Math.random().toString(36).substring(2, 9);
    const colors = ["6366f1", "8b5cf6", "ec4899", "3b82f6", "10b981", "f59e0b"];
    const bg = colors[Math.floor(Math.random() * colors.length)];
    const url = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${seed}&backgroundColor=${bg}`;
    setCoverImageUrl(url);
    isDirtyRef.current = true;
    setSaveStatus("unsaved");
    toast.success("Generated artwork cover");
  }

  function handleAddTag(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (clean && !tags.includes(clean)) {
      if (tags.length >= 6) {
        toast.error("Maximum 6 tags allowed per article");
        return;
      }
      setTags((prev) => [...prev, clean]);
      setTagInput("");
      isDirtyRef.current = true;
      setSaveStatus("unsaved");
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
    isDirtyRef.current = true;
    setSaveStatus("unsaved");
  }

  async function handleFinalPublish() {
    if (!title.trim()) {
      toast.error("Article title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Article content is required");
      return;
    }

    setIsSubmitting(true);
    haptics.medium();

    try {
      const endpoint = slug ? `/api/articles/${slug}` : "/api/articles";
      const method = slug ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          content: content.trim(),
          coverImageUrl: coverImageUrl || null,
          category,
          tags,
          status: "PUBLISHED",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish article");
      }

      // Clear local draft
      localStorage.removeItem("campusloop_article_draft");
      isDirtyRef.current = false;

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
      sounds.pop();
      toast.success("Article Published! +15 Loop Points (LP)");

      const publishedSlug = data.article?.slug || slug;
      setTimeout(() => {
        router.push(`/articles/${publishedSlug}`);
      }, 700);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish article");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen pb-28 bg-background max-w-4xl mx-auto px-4 sm:px-6">
      {/* ─── Hidden File Input for Cover Upload ─── */}
      <input
        ref={coverImageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) handleCoverUpload(files[0]);
        }}
      />

      {/* ─── Top Sticky Controls Bar ─── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur-xl gap-2 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-8.5 items-center justify-center rounded-full border border-border/40 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Go back"
          >
            <ArrowLeft className="size-4" />
          </button>

          <div className="flex items-center gap-2 truncate">
            <span className="text-xs sm:text-sm font-bold text-foreground truncate">
              {isEditing ? "Edit Article" : "Write Article"}
            </span>

            {/* Autosave Status Indicator */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1 text-primary">
                  <Loader2 className="size-3 animate-spin" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Check className="size-3 text-emerald-500" />
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === "unsaved" && (
                <span className="text-muted-foreground/70">Unsaved changes</span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1 text-amber-500">
                  <AlertCircle className="size-3" />
                  <span>Draft saved locally</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Write / Preview Tab Switcher */}
          <div className="flex items-center rounded-full bg-muted/60 p-0.5 border border-border/40">
            <button
              type="button"
              onClick={() => setActiveTab("write")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                activeTab === "write"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                activeTab === "preview"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye className="size-3" />
              <span>Preview</span>
            </button>
          </div>

          {/* Publish Trigger Button */}
          <Button
            size="sm"
            onClick={() => setShowPublishModal(true)}
            className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 shadow-xs hover:opacity-90 active:scale-95 cursor-pointer"
          >
            <span>Publish</span>
            <ChevronRight className="size-3 ml-0.5" />
          </Button>
        </div>
      </header>

      {/* ─── Mode 1: Write Area ─── */}
      {activeTab === "write" && (
        <div className="space-y-4">
          {/* Cover Image Upload Area */}
          <div className="relative group">
            {coverImageUrl ? (
              <div className="relative aspect-21/9 w-full rounded-2xl overflow-hidden border border-border/40 bg-muted/30">
                <img src={coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverImageInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 cursor-pointer shadow-md"
                  >
                    Change Cover
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl("")}
                    className="px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 cursor-pointer shadow-md"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverImageInputRef.current?.click()}
                disabled={isUploadingCover}
                className="w-full py-4 rounded-xl border border-dashed border-border/50 hover:border-primary/40 bg-muted/20 hover:bg-muted/30 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {isUploadingCover ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <Upload className="size-4" />
                )}
                <span>Add Cover Image</span>
              </button>
            )}
          </div>

          {/* Title Textarea */}
          <input
            type="text"
            placeholder="Article Title..."
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-2xl sm:text-4xl font-black text-foreground placeholder:text-muted-foreground/40 bg-transparent border-none outline-none tracking-tight leading-tight"
          />

          {/* Subtitle Textarea */}
          <input
            type="text"
            placeholder="Add a subtitle or key takeaway..."
            value={subtitle}
            onChange={(e) => handleSubtitleChange(e.target.value)}
            className="w-full text-base sm:text-lg font-normal text-muted-foreground placeholder:text-muted-foreground/40 bg-transparent border-none outline-none leading-relaxed"
          />

          {/* TipTap Rich Markdown Editor */}
          <div className="pt-2">
            <NovelMarkdownEditor
              initialContent={content}
              onChange={handleContentChange}
              placeholder="Tell your story, roadmap, or engineering guide... (Type '/' for commands)"
            />
          </div>
        </div>
      )}

      {/* ─── Mode 2: Full Publication Preview ─── */}
      {activeTab === "preview" && (
        <div className="space-y-6 pt-4 max-w-3xl mx-auto">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary flex items-center gap-2">
            <Eye className="size-4 shrink-0" />
            <span>This is an exact preview of how your article will appear when published.</span>
          </div>

          <div className="space-y-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border text-primary bg-primary/10 border-primary/20">
              {getCategoryMeta(category).label}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
              {title || "Untitled Article"}
            </h1>

            {subtitle && <p className="text-lg text-muted-foreground leading-relaxed">{subtitle}</p>}

            <div className="flex items-center gap-3 pt-3 border-y border-border/30 py-3 text-xs text-muted-foreground">
              <Avatar className="size-8 border border-border/40">
                <AvatarImage src={currentProfile?.avatarUrl || ""} />
                <AvatarFallback className="font-bold bg-muted text-foreground">
                  {currentProfile?.displayName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-foreground">
                  {currentProfile?.displayName || `@${currentProfile?.username || "student"}`}
                </p>
                <p className="text-[11px]">
                  {readingTime} min read · {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {coverImageUrl && (
            <div className="aspect-16/9 w-full rounded-2xl overflow-hidden border border-border/40">
              <img src={coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="prose dark:prose-invert max-w-none text-foreground text-[18px] leading-[1.8] pt-4 font-normal">
            <MarkdownContent content={content || "*Start writing to preview article body...*"} />
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border/30">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg bg-muted/40 text-xs font-semibold text-muted-foreground border border-border/40"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Publishing Settings Modal (Phase 31) ─── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in-50">
          <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">Publication Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-xl border border-border/50 bg-muted/30 px-3 text-xs font-semibold text-foreground outline-none focus:border-primary"
              >
                {ARTICLE_CATEGORY_LIST.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label} — {c.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Tags (up to 6)</label>
              <form onSubmit={handleAddTag} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. placements, dsa..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button type="submit" size="sm" variant="outline" className="h-9 text-xs font-bold">
                  Add
                </Button>
              </form>

              {/* Tag Chips */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:opacity-75 cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-1 pt-1">
                <span className="text-[10px] text-muted-foreground mr-1">Suggestions:</span>
                {SUGGESTED_TAGS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      if (!tags.includes(st) && tags.length < 6) {
                        setTags((prev) => [...prev, st]);
                      }
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                  >
                    #{st}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Image Choice */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Cover Image</label>
                <button
                  type="button"
                  onClick={generateArtworkCover}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Generate Artwork
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => coverImageInputRef.current?.click()}
                  className="h-9 text-xs font-bold shrink-0"
                >
                  Upload
                </Button>
              </div>
            </div>

            {/* Publication Confirmation Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPublishModal(false)}
                className="text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={handleFinalPublish}
                disabled={isSubmitting}
                className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-5 shadow-xs hover:opacity-90 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : (
                  <Send className="size-3.5 mr-1.5" />
                )}
                <span>Publish Now</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
