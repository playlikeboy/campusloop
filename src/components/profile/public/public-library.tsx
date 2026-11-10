import { Download, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface PublicArticle {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  readingTimeMinutes?: number | null;
  publishedAt?: Date | string | null;
}

interface PublicResource {
  id: string;
  title: string;
  subjectCode?: string | null;
  resourceType?: string | null;
  semester?: number | string | null;
  downloadsCount?: number | null;
  upvotesCount?: number | null;
}

interface PublicPlaylist {
  id: string;
  slug: string;
  title: string;
  itemsCount?: number | null;
}

function shortDate(d?: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function PublicArticles({ articles }: { articles: PublicArticle[] }) {
  if (articles.length === 0) return null;
  return (
    <section className="space-y-3" aria-labelledby="public-articles">
      <h2 id="public-articles" className="text-lg text-fg">
        Articles
      </h2>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {articles.map((a) => (
          <li key={a.id}>
            <Link href={`/articles/${a.slug}`} className="block space-y-1 p-4 transition-ui hover:bg-surface-muted">
              <h3 className="line-clamp-2 text-base text-fg">{a.title}</h3>
              {a.excerpt && <p className="line-clamp-2 text-sm text-fg-muted">{a.excerpt}</p>}
              <p className="text-sm text-fg-subtle">
                {[shortDate(a.publishedAt), `${a.readingTimeMinutes || 3} min read`].filter(Boolean).join(" · ")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PublicStudyLibrary({
  resources,
  playlists,
}: {
  resources: PublicResource[];
  playlists: PublicPlaylist[];
}) {
  if (resources.length === 0 && playlists.length === 0) return null;
  return (
    <section className="space-y-3" aria-labelledby="public-notes">
      <h2 id="public-notes" className="text-lg text-fg">
        Notes and playlists
      </h2>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {playlists.map((pl) => (
          <li key={pl.id}>
            <Link
              href={`/academics/study-material/playlists/${pl.slug}`}
              className="flex items-center justify-between gap-3 p-4 transition-ui hover:bg-surface-muted"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-fg">{pl.title}</span>
                <span className="text-sm text-fg-muted">Playlist · {pl.itemsCount ?? 0} items</span>
              </span>
            </Link>
          </li>
        ))}
        {resources.map((r) => (
          <li key={r.id}>
            <Link
              href={`/academics/study-material/${r.id}`}
              className="flex items-center justify-between gap-3 p-4 transition-ui hover:bg-surface-muted"
            >
              <span className="min-w-0 space-y-1">
                <span className="block truncate text-sm font-semibold text-fg">{r.title}</span>
                <span className="flex flex-wrap items-center gap-1.5 text-sm text-fg-muted">
                  {r.subjectCode && <Badge variant="neutral">{r.subjectCode}</Badge>}
                  {[r.resourceType, r.semester ? `Sem ${r.semester}` : null].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3 text-sm tabular-nums text-fg-subtle">
                <span className="flex items-center gap-1">
                  <Download aria-hidden="true" className="size-4" />
                  {r.downloadsCount ?? 0}
                  <span className="sr-only">downloads</span>
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp aria-hidden="true" className="size-4" />
                  {r.upvotesCount ?? 0}
                  <span className="sr-only">upvotes</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
