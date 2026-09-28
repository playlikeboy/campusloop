"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Edit3,
  Eye,
  FileEdit,
  FileText,
  LayoutDashboard,
  Plus,
  QrCode,
  Share2,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BrandedQrModal } from "@/components/common/branded-qr-modal";
import { ARTICLE_CATEGORIES, CANONICAL_ARTICLE_HOST } from "@/constants/articles";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  category: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  readingTimeMinutes?: number | null;
  viewsCount?: number | null;
  upvotesCount?: number | null;
  updatedAt: string | Date;
  publishedAt?: string | Date | null;
}

interface ArticleDashboardClientProps {
  publishedArticles: ArticleItem[];
  draftArticles: ArticleItem[];
  archivedArticles: ArticleItem[];
  stats: {
    totalViews: number;
    totalUpvotes: number;
    publishedCount: number;
    draftsCount: number;
    archivedCount: number;
  };
}

export function ArticleDashboardClient({
  publishedArticles: initialPublished,
  draftArticles: initialDrafts,
  archivedArticles: initialArchived,
  stats: initialStats,
}: ArticleDashboardClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"published" | "drafts" | "archived">("published");
  const [published, setPublished] = useState<ArticleItem[]>(initialPublished);
  const [drafts, setDrafts] = useState<ArticleItem[]>(initialDrafts);
  const [archived, setArchived] = useState<ArticleItem[]>(initialArchived);
  const [selectedArticleForQr, setSelectedArticleForQr] = useState<ArticleItem | null>(null);

  // Derived reactive stats
  const totalViews = published.reduce((sum, a) => sum + (a.viewsCount || 0), 0);
  const totalUpvotes = published.reduce((sum, a) => sum + (a.upvotesCount || 0), 0);
  const publishedCount = published.length;
  const draftsCount = drafts.length;
  const archivedCount = archived.length;

  async function handleDelete(article: ArticleItem) {
    if (!confirm(`Are you sure you want to permanently delete "${article.title}"?`)) return;

    haptics.medium();
    try {
      const res = await fetch(`/api/articles/${article.slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Article deleted");
      if (article.status === "PUBLISHED") {
        setPublished((prev) => prev.filter((a) => a.id !== article.id));
      } else if (article.status === "DRAFT") {
        setDrafts((prev) => prev.filter((a) => a.id !== article.id));
      } else {
        setArchived((prev) => prev.filter((a) => a.id !== article.id));
      }
    } catch {
      toast.error("Failed to delete article");
    }
  }

  async function handleArchiveToggle(article: ArticleItem) {
    const isCurrentlyArchived = article.status === "ARCHIVED";
    const nextStatus = isCurrentlyArchived ? "PUBLISHED" : "ARCHIVED";
    const actionLabel = isCurrentlyArchived ? "unarchive" : "archive";

    haptics.light();
    try {
      const res = await fetch(`/api/articles/${article.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error(`Failed to ${actionLabel}`);

      const updated = { ...article, status: nextStatus as any };
      toast.success(isCurrentlyArchived ? "Article restored to Published" : "Article moved to Archived");

      if (isCurrentlyArchived) {
        setArchived((prev) => prev.filter((a) => a.id !== article.id));
        setPublished((prev) => [updated, ...prev]);
      } else {
        setPublished((prev) => prev.filter((a) => a.id !== article.id));
        setArchived((prev) => [updated, ...prev]);
      }
    } catch {
      toast.error(`Could not ${actionLabel} article`);
    }
  }

  function handleShare(article: ArticleItem) {
    const url = `${CANONICAL_ARTICLE_HOST}/articles/${article.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Article link copied to clipboard");
    }
  }

  const currentList = activeTab === "published" ? published : activeTab === "drafts" ? drafts : archived;

  return (
    <div className="min-h-screen pb-28 border-x border-border/30 bg-background max-w-4xl mx-auto">
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/30 bg-background/85 px-4 backdrop-blur-xl gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/articles")}
            className="flex size-9 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Back to Articles Hub"
          >
            <ArrowLeft className="size-4.5" />
          </button>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="size-4 text-primary" />
            <h1 className="text-base font-black text-foreground tracking-tight">Articles Workspace</h1>
          </div>
        </div>

        <Link
          href="/articles/new"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-black hover:opacity-90 shadow-md shadow-primary/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="size-3.5" strokeWidth={3} />
          <span>New Article</span>
        </Link>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        {/* ─── Stats Overview Grid ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold">Total Reads</span>
              <Eye className="size-3.5 text-primary" />
            </div>
            <p className="text-2xl font-black text-foreground">{totalViews}</p>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold">Total Upvotes</span>
              <ThumbsUp className="size-3.5 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-foreground">{totalUpvotes}</p>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold">Published</span>
              <BookOpen className="size-3.5 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-foreground">{publishedCount}</p>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold">Drafts</span>
              <FileEdit className="size-3.5 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-foreground">{draftsCount}</p>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-xl border border-border/40 bg-card/60 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold">Archived</span>
              <Archive className="size-3.5 text-zinc-500" />
            </div>
            <p className="text-2xl font-black text-foreground">{archivedCount}</p>
          </div>
        </div>

        {/* ─── Tab Switcher ─── */}
        <div className="flex items-center justify-between border-b border-border/30 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                sounds.tap();
                setActiveTab("published");
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "published"
                  ? "bg-foreground text-background shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              Published ({publishedCount})
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.tap();
                setActiveTab("drafts");
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "drafts"
                  ? "bg-foreground text-background shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              Drafts ({draftsCount})
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.tap();
                setActiveTab("archived");
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTab === "archived"
                  ? "bg-foreground text-background shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              Archived ({archivedCount})
            </button>
          </div>
        </div>

        {/* ─── Articles List ─── */}
        {currentList.length > 0 ? (
          <div className="divide-y divide-border/20 space-y-2">
            {currentList.map((item) => {
              const categoryConfig = ARTICLE_CATEGORIES[item.category as keyof typeof ARTICLE_CATEGORIES];
              const categoryLabel = categoryConfig?.label || item.category || "General";
              const lastUpdated = item.updatedAt
                ? new Date(item.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null;

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3.5 pb-3 rounded-xl hover:bg-muted/20 px-3 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {item.coverImageUrl && (
                      <div className="relative size-14 shrink-0 rounded-lg overflow-hidden border border-border/40 bg-muted hidden sm:block">
                        <Image
                          src={item.coverImageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    )}

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {categoryLabel}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {item.readingTimeMinutes || 3} min read
                        </span>
                        {item.status === "DRAFT" && (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                            Draft
                          </span>
                        )}
                        {item.status === "ARCHIVED" && (
                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded">
                            Archived
                          </span>
                        )}
                        {lastUpdated && (
                          <span className="text-[10px] text-muted-foreground">Updated {lastUpdated}</span>
                        )}
                      </div>

                      <Link
                        href={
                          item.status === "PUBLISHED"
                            ? `/articles/${item.slug}`
                            : `/articles/${item.slug}/edit`
                        }
                        className="text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-1 cursor-pointer"
                      >
                        {item.title}
                      </Link>

                      {item.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.excerpt}</p>
                      )}

                      {item.status === "PUBLISHED" && (
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-0.5">
                          <span className="flex items-center gap-1">
                            <Eye className="size-3" />
                            <span>{item.viewsCount || 0} reads</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="size-3 text-primary" />
                            <span>{item.upvotesCount || 0} upvotes</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {item.status === "PUBLISHED" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedArticleForQr(item)}
                          className="flex size-8 items-center justify-center rounded-lg border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Share QR Code"
                        >
                          <QrCode className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShare(item)}
                          className="flex size-8 items-center justify-center rounded-lg border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Copy Link"
                        >
                          <Share2 className="size-3.5" />
                        </button>

                        <Link
                          href={`/articles/${item.slug}`}
                          className="flex size-8 items-center justify-center rounded-lg border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="View Public Article"
                        >
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </>
                    )}

                    <Link
                      href={`/articles/${item.slug}/edit`}
                      className="flex size-8 items-center justify-center rounded-lg border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Continue Editing"
                    >
                      <Edit3 className="size-3.5" />
                    </Link>

                    {item.status !== "DRAFT" && (
                      <button
                        type="button"
                        onClick={() => handleArchiveToggle(item)}
                        className="flex size-8 items-center justify-center rounded-lg border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title={item.status === "ARCHIVED" ? "Restore to Published" : "Archive Article"}
                      >
                        {item.status === "ARCHIVED" ? (
                          <ArchiveRestore className="size-3.5 text-blue-500" />
                        ) : (
                          <Archive className="size-3.5" />
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="flex size-8 items-center justify-center rounded-lg border border-border/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      title="Delete Article"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 rounded-xl border border-dashed border-border/60 p-8">
            <FileText className="size-9 text-muted-foreground/40" />
            <p className="text-xs font-bold text-foreground">
              {activeTab === "published"
                ? "No published articles yet"
                : activeTab === "drafts"
                  ? "No drafts saved"
                  : "No archived articles"}
            </p>
            <Link
              href="/articles/new"
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 transition-all shadow-sm"
            >
              Write an Article
            </Link>
          </div>
        )}
      </div>

      {/* Branded QR Code Modal */}
      {selectedArticleForQr && (
        <BrandedQrModal
          isOpen={Boolean(selectedArticleForQr)}
          onClose={() => setSelectedArticleForQr(null)}
          title={selectedArticleForQr.title}
          subtitle={`${selectedArticleForQr.readingTimeMinutes || 3} min read • Verified Student Article`}
          badgeText="Campus Article"
          shortUrl={`${CANONICAL_ARTICLE_HOST}/articles/${selectedArticleForQr.slug}`}
          category="article"
        />
      )}
    </div>
  );
}
