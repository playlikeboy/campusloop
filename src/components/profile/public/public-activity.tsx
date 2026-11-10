import { BarChart2, ExternalLink, FileText, MessageSquare, PenLine, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { extractMediaAttachments } from "@/lib/media-attachments";

export interface PublicPost {
  id: string;
  title?: string | null;
  body?: string | null;
  votes: { value: number }[];
  comments: unknown[];
  pollOptions?: unknown[] | null;
  externalUrl?: string | null;
}

function stripMarkdown(text: string) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}

/** Latest public posts, as a calm list. Anonymous posts are never included. */
export function PublicActivity({ posts, username }: { posts: PublicPost[]; username: string }) {
  return (
    <section className="space-y-3" aria-labelledby="public-posts">
      <h2 id="public-posts" className="text-lg text-fg">
        Posts
      </h2>
      {posts.length === 0 ? (
        <EmptyState icon={PenLine} size="compact" bordered title="No posts yet" description={`@${username} hasn't posted yet.`} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {posts.slice(0, 10).map((p) => {
            const parsed = extractMediaAttachments(p.body || "");
            const image = parsed.attachments.find((a) => a.type === "image");
            const doc = parsed.attachments.find((a) => a.type === "document");
            const score = p.votes.reduce((acc, v) => acc + v.value, 0);
            return (
              <li key={p.id}>
                <Link href={`/post/${p.id}`} className="block space-y-2 p-4 transition-ui hover:bg-surface-muted">
                  {p.title && <h3 className="line-clamp-2 text-base text-fg">{stripMarkdown(p.title)}</h3>}
                  {image ? (
                    <img src={image.url} alt="" className="aspect-video max-h-56 w-full rounded-md bg-surface-muted object-cover" loading="lazy" />
                  ) : doc ? (
                    <p className="flex items-center gap-2 text-sm text-fg-muted">
                      <FileText aria-hidden="true" className="size-4 shrink-0" />
                      <span className="truncate">{doc.label || "Attached file"}</span>
                    </p>
                  ) : null}
                  {p.externalUrl ? (
                    <p className="flex items-center gap-2 text-sm text-fg-muted">
                      <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
                      {hostOf(p.externalUrl)}
                    </p>
                  ) : parsed.text ? (
                    <p className="line-clamp-2 text-sm text-fg-muted">{stripMarkdown(parsed.text)}</p>
                  ) : null}
                  <p className="flex flex-wrap items-center gap-4 text-sm text-fg-subtle">
                    {p.pollOptions && p.pollOptions.length > 0 && (
                      <span className="flex items-center gap-1">
                        <BarChart2 aria-hidden="true" className="size-4" />
                        Poll
                      </span>
                    )}
                    <span className="flex items-center gap-1 tabular-nums">
                      <ThumbsUp aria-hidden="true" className="size-4" />
                      {score}
                      <span className="sr-only">upvotes</span>
                    </span>
                    <span className="flex items-center gap-1 tabular-nums">
                      <MessageSquare aria-hidden="true" className="size-4" />
                      {p.comments.length}
                      <span className="sr-only">comments</span>
                    </span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
