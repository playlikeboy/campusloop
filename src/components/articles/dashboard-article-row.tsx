"use client";

import { Archive, ArchiveRestore, Edit3, Eye, Link2, QrCode, ThumbsUp, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ARTICLE_CATEGORIES } from "@/constants/articles";

export interface DashboardArticle {
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

/** One article in the writer dashboard: title, status, numbers and actions. */
export function DashboardArticleRow({
  item,
  onShowQr,
  onCopyLink,
  onArchiveToggle,
  onDelete,
}: {
  item: DashboardArticle;
  onShowQr: () => void;
  onCopyLink: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
}) {
  const categoryLabel =
    ARTICLE_CATEGORIES[item.category as keyof typeof ARTICLE_CATEGORIES]?.label || item.category || "General";
  const updated = item.updatedAt
    ? new Date(item.updatedAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const isPublished = item.status === "PUBLISHED";

  return (
    <li className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {item.coverImageUrl && (
          <div className="relative hidden size-14 shrink-0 overflow-hidden rounded-sm bg-surface-muted sm:block">
            <Image src={item.coverImageUrl} alt="" fill className="object-cover" sizes="56px" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <Badge variant="neutral">{categoryLabel}</Badge>
            {item.status === "DRAFT" && <Badge variant="warning">Draft</Badge>}
            {item.status === "ARCHIVED" && <Badge variant="outline">Archived</Badge>}
            {updated && <span>Updated {updated}</span>}
          </div>
          <Link
            href={isPublished ? `/articles/${item.slug}` : `/articles/${item.slug}/edit`}
            className="line-clamp-2 text-base font-semibold text-fg hover:text-brand-text"
          >
            {item.title}
          </Link>
          {isPublished && (
            <p className="flex items-center gap-4 text-xs text-fg-muted tabular-nums">
              <span className="flex items-center gap-1">
                <Eye aria-hidden className="size-3.5" />
                {item.viewsCount || 0} reads
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp aria-hidden className="size-3.5" />
                {item.upvotesCount || 0} upvotes
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
        {isPublished && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowQr}
              aria-label="Show QR code"
              title="Show QR code"
            >
              <QrCode className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onCopyLink} aria-label="Copy link" title="Copy link">
              <Link2 className="size-4" />
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/articles/${item.slug}/edit`} aria-label="Edit" title="Edit">
            <Edit3 className="size-4" />
          </Link>
        </Button>
        {item.status !== "DRAFT" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onArchiveToggle}
            aria-label={item.status === "ARCHIVED" ? "Publish again" : "Archive"}
            title={item.status === "ARCHIVED" ? "Publish again" : "Archive"}
          >
            {item.status === "ARCHIVED" ? (
              <ArchiveRestore className="size-4" />
            ) : (
              <Archive className="size-4" />
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Delete"
          title="Delete"
          className="hover:bg-danger-subtle hover:text-danger"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}
