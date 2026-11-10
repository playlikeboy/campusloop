"use client";

import { ArrowLeft, Eye, PenLine, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArticlePreview,
  CoverPicker,
  type SaveStatus,
  SaveStatusLabel,
} from "@/components/articles/editor/editor-parts";
import { PublishDialog } from "@/components/articles/editor/publish-dialog";
import { NovelMarkdownEditor } from "@/components/articles/novel-markdown-editor";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadImageToImgBB } from "@/lib/upload";

const DRAFT_KEY = "campusloop_article_draft";

function readLocalDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalDraft(value: unknown) {
  try {
    if (value === null) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
  } catch {
    // Private mode or storage full: the server draft still exists.
  }
}

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

  // Editor mode & drawer
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autosave status state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const isDirtyRef = useRef(false);

  // Cover image uploading
  const coverImageInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Load draft from localStorage if creating brand new article and no initial article
  useEffect(() => {
    if (!isEditing && !initialArticle) {
      const parsed = readLocalDraft();
      if (parsed) {
        if (parsed.title) setTitle(parsed.title);
        if (parsed.subtitle) setSubtitle(parsed.subtitle);
        if (parsed.content) setContent(parsed.content);
        if (parsed.coverImageUrl) setCoverImageUrl(parsed.coverImageUrl);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.tags) setTags(parsed.tags);
        if (parsed.slug) setSlug(parsed.slug);
        if (parsed.articleId) setArticleId(parsed.articleId);
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
          title: title.trim() || "Untitled draft",
          subtitle: subtitle.trim() || null,
          content: content.trim() || "...",
          coverImageUrl: coverImageUrl || null,
          category,
          tags,
          status: "DRAFT",
        }),
      });

      if (!res.ok) throw new Error();
      const data = (await res.json()) as { article?: { id: string; slug: string } };

      if (data.article) {
        if (!slug && data.article.slug) setSlug(data.article.slug);
        if (!articleId && data.article.id) setArticleId(data.article.id);
      }

      // Also persist to localStorage
      writeLocalDraft({
        articleId: data.article?.id || articleId,
        slug: data.article?.slug || slug,
        title,
        subtitle,
        content,
        coverImageUrl,
        category,
        tags,
      });

      isDirtyRef.current = false;
      setSaveStatus("saved");
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
    const toastId = toast.loading("Uploading cover…");

    try {
      const { displayUrl } = await uploadImageToImgBB(file);
      setCoverImageUrl(displayUrl);
      isDirtyRef.current = true;
      setSaveStatus("unsaved");
      toast.success("Cover added", { id: toastId });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't upload the cover. Try a smaller JPG or PNG.",
        { id: toastId }
      );
    } finally {
      setIsUploadingCover(false);
      if (coverImageInputRef.current) coverImageInputRef.current.value = "";
    }
  }

  function generateArtworkCover() {
    const styles = ["shapes", "identicon", "lorelei"];
    const selectedStyle = styles[Math.floor(Math.random() * styles.length)];
    const seed = Math.random().toString(36).substring(2, 9);
    // Loop Violet family, as URL params for the pattern service.
    const colors = ["6b3df5", "5a2be0", "24164f", "d0c0ff"];
    const bg = colors[Math.floor(Math.random() * colors.length)];
    const url = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${seed}&backgroundColor=${bg}`;
    setCoverImageUrl(url);
    isDirtyRef.current = true;
    setSaveStatus("unsaved");
  }

  function markDirty() {
    isDirtyRef.current = true;
    setSaveStatus("unsaved");
  }

  async function handleFinalPublish() {
    if (!title.trim()) {
      toast.error("Add a title before you publish.");
      return;
    }
    if (!content.trim()) {
      toast.error("Write something before you publish.");
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

      const data = (await res.json().catch(() => ({}))) as {
        article?: { id: string; slug: string };
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Couldn't publish. Your draft is saved, so try again.");
      }

      writeLocalDraft(null);
      isDirtyRef.current = false;

      sounds.pop();
      toast.success(isEditing ? "Changes published" : "Published. You earned 15 Loop Points.");

      const publishedSlug = data.article?.slug || slug;
      setTimeout(() => {
        router.push(`/articles/${publishedSlug}`);
      }, 700);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't publish. Your draft is saved, so try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 pb-28 sm:px-6">
      <input
        ref={coverImageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCoverUpload(file);
        }}
      />

      <header className="sticky top-0 z-40 -mx-4 mb-6 flex h-16 items-center justify-between gap-2 border-b border-border bg-bg px-4 sm:-mx-6 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">
              {isEditing ? "Edit article" : "New article"}
            </p>
            <SaveStatusLabel status={saveStatus} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SegmentedControl
            size="sm"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: "write", label: "Write", icon: <PenLine className="size-3.5" /> },
              { value: "preview", label: "Preview", icon: <Eye className="size-3.5" /> },
            ]}
          />
          <Button size="sm" onClick={() => setShowPublishModal(true)}>
            <Send className="size-4" />
            <span className="hidden sm:inline">{isEditing ? "Publish changes" : "Publish"}</span>
            <span className="sm:hidden">Publish</span>
          </Button>
        </div>
      </header>

      {activeTab === "write" ? (
        <div className="space-y-4">
          <CoverPicker
            url={coverImageUrl}
            uploading={isUploadingCover}
            onPick={() => coverImageInputRef.current?.click()}
            onRemove={() => {
              setCoverImageUrl("");
              markDirty();
            }}
          />
          <label htmlFor="article-title" className="sr-only">
            Title
          </label>
          <input
            id="article-title"
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full border-none bg-transparent font-display text-3xl leading-tight font-extrabold text-fg outline-none placeholder:text-fg-subtle sm:text-5xl"
          />
          <label htmlFor="article-subtitle" className="sr-only">
            Subtitle
          </label>
          <input
            id="article-subtitle"
            type="text"
            placeholder="One line on what it's about (optional)"
            value={subtitle}
            onChange={(e) => handleSubtitleChange(e.target.value)}
            className="w-full border-none bg-transparent text-lg text-fg-muted outline-none placeholder:text-fg-subtle"
          />
          <div className="pt-2">
            <NovelMarkdownEditor
              initialContent={content}
              onChange={handleContentChange}
              placeholder="Start writing. Type / for headings, lists, code and more."
            />
          </div>
        </div>
      ) : (
        <ArticlePreview
          title={title}
          subtitle={subtitle}
          content={content}
          coverImageUrl={coverImageUrl}
          category={category}
          tags={tags}
          readingTime={readingTime}
          author={currentProfile}
        />
      )}

      <PublishDialog
        open={showPublishModal}
        onOpenChange={setShowPublishModal}
        isEditing={isEditing}
        category={category}
        onCategoryChange={(value) => {
          setCategory(value);
          markDirty();
        }}
        tags={tags}
        onTagsChange={(next) => {
          setTags(next);
          markDirty();
        }}
        coverImageUrl={coverImageUrl}
        onCoverChange={(url) => {
          setCoverImageUrl(url);
          markDirty();
        }}
        onUploadCover={() => coverImageInputRef.current?.click()}
        onGenerateCover={generateArtworkCover}
        onPublish={handleFinalPublish}
        publishing={isSubmitting}
      />
    </div>
  );
}
