"use client";

import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { type DashboardArticle, DashboardArticleRow } from "@/components/articles/dashboard-article-row";
import { BrandedQrModal } from "@/components/common/branded-qr-modal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CANONICAL_ARTICLE_HOST } from "@/constants/articles";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

type DashboardTab = "published" | "drafts" | "archived";

const EMPTY_COPY: Record<DashboardTab, string> = {
  published: "Nothing published yet",
  drafts: "No drafts",
  archived: "Nothing archived",
};

interface ArticleDashboardClientProps {
  publishedArticles: DashboardArticle[];
  draftArticles: DashboardArticle[];
  archivedArticles: DashboardArticle[];
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
}: ArticleDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"published" | "drafts" | "archived">("published");
  const [published, setPublished] = useState<DashboardArticle[]>(initialPublished);
  const [drafts, setDrafts] = useState<DashboardArticle[]>(initialDrafts);
  const [archived, setArchived] = useState<DashboardArticle[]>(initialArchived);
  const [selectedArticleForQr, setSelectedArticleForQr] = useState<DashboardArticle | null>(null);

  const totalViews = published.reduce((sum, a) => sum + (a.viewsCount || 0), 0);
  const totalUpvotes = published.reduce((sum, a) => sum + (a.upvotesCount || 0), 0);

  async function handleDelete(article: DashboardArticle) {
    if (!confirm(`Delete "${article.title}"? This can't be undone.`)) return;

    haptics.medium();
    try {
      const res = await fetch(`/api/articles/${article.slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      toast.success("Article deleted");
      if (article.status === "PUBLISHED") {
        setPublished((prev) => prev.filter((a) => a.id !== article.id));
      } else if (article.status === "DRAFT") {
        setDrafts((prev) => prev.filter((a) => a.id !== article.id));
      } else {
        setArchived((prev) => prev.filter((a) => a.id !== article.id));
      }
    } catch {
      toast.error("Couldn't delete the article. Try again.");
    }
  }

  async function handleArchiveToggle(article: DashboardArticle) {
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
      toast.success(isCurrentlyArchived ? "Published again" : "Archived");

      if (isCurrentlyArchived) {
        setArchived((prev) => prev.filter((a) => a.id !== article.id));
        setPublished((prev) => [updated, ...prev]);
      } else {
        setPublished((prev) => prev.filter((a) => a.id !== article.id));
        setArchived((prev) => [updated, ...prev]);
      }
    } catch {
      toast.error(`Couldn't ${actionLabel} the article. Try again.`);
    }
  }

  function handleShare(article: DashboardArticle) {
    const url = `${CANONICAL_ARTICLE_HOST}/articles/${article.slug}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Couldn't copy the link."));
  }

  const currentList = activeTab === "published" ? published : activeTab === "drafts" ? drafts : archived;

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 pt-6 pb-28 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl text-fg">My articles</h1>
          <p className="mt-1 text-sm text-fg-muted tabular-nums">
            {published.length > 0
              ? `${totalViews} reads and ${totalUpvotes} upvotes across ${published.length} published ${published.length === 1 ? "article" : "articles"}.`
              : "Your published articles, drafts and archive."}
          </p>
        </div>
        <Button asChild>
          <Link href="/articles/new">
            <Plus className="size-4" />
            New article
          </Link>
        </Button>
      </header>

      <div className="pt-5">
        <SegmentedControl
          value={activeTab}
          onChange={(tab) => {
            sounds.tap();
            setActiveTab(tab);
          }}
          options={[
            { value: "published", label: `Published (${published.length})` },
            { value: "drafts", label: `Drafts (${drafts.length})` },
            { value: "archived", label: `Archived (${archived.length})` },
          ]}
        />
      </div>

      {currentList.length > 0 ? (
        <ul className="divide-y divide-border">
          {currentList.map((item) => (
            <DashboardArticleRow
              key={item.id}
              item={item}
              onShowQr={() => setSelectedArticleForQr(item)}
              onCopyLink={() => handleShare(item)}
              onArchiveToggle={() => handleArchiveToggle(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mt-6"
          icon={FileText}
          title={EMPTY_COPY[activeTab]}
          description="Write about your placement prep, a project or campus life."
          action={
            <Button asChild>
              <Link href="/articles/new">Write an article</Link>
            </Button>
          }
          bordered
        />
      )}

      {selectedArticleForQr && (
        <BrandedQrModal
          isOpen={Boolean(selectedArticleForQr)}
          onClose={() => setSelectedArticleForQr(null)}
          title={selectedArticleForQr.title}
          subtitle={`${selectedArticleForQr.readingTimeMinutes || 3} min read`}
          badgeText="Article"
          shortUrl={`${CANONICAL_ARTICLE_HOST}/articles/${selectedArticleForQr.slug}`}
          category="article"
        />
      )}
    </div>
  );
}
