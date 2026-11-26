import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export interface InBodyLink {
  href: string;
  label: string;
  /** Small label above the link: "Article", "Free course", "College", "Topic". */
  kind: string;
}

export interface ArticleSource {
  url: string;
  label: string;
  description?: string | null;
}

/** "Related on CampusLoop": three links placed inside the article body. */
export function ArticleRelatedBox({ links }: { links: InBodyLink[] }) {
  if (links.length === 0) return null;
  return (
    <aside aria-labelledby="related-on-campusloop" className="not-prose my-8 rounded-lg border border-border bg-surface p-5">
      <p id="related-on-campusloop" className="text-base font-bold text-fg">
        Related on CampusLoop
      </p>
      <ul className="mt-3 divide-y divide-border">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex min-h-11 items-center justify-between gap-3 py-2.5 text-fg transition-ui hover:text-brand-text"
            >
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-fg-muted">{link.kind}</span>
                <span className="block text-base font-semibold leading-snug group-hover:underline">{link.label}</span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-fg-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** "Sources" list at the end of the article, from the article's saved links. */
export function ArticleSources({ sources }: { sources: ArticleSource[] }) {
  if (sources.length === 0) return null;
  return (
    <section aria-labelledby="article-sources" className="space-y-3">
      <h2 id="article-sources" className="text-2xl text-fg">
        Sources
      </h2>
      <ol className="list-decimal space-y-2 pl-5 text-fg-muted">
        {sources.map((source) => (
          <li key={source.url} className="pl-1">
            <a
              href={source.url}
              target="_blank"
              rel="noopener"
              className="font-medium text-brand-text underline-offset-2 hover:underline"
            >
              {source.label}
            </a>
            {source.description && <span className="text-sm"> · {source.description}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
