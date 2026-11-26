import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArticleLinkList, PageLinks } from "@/components/articles/article-link-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCategoryMeta } from "@/constants/articles";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { EDITORIAL_BIO, EDITORIAL_NAME, EDITORIAL_USERNAME } from "@/lib/articles/byline";
import {
  categoryCounts,
  editorialArticlesWhere,
  listArticles,
  personArticlesWhere,
} from "@/lib/articles/hub-queries";
import { ARTICLE_CATEGORY_PAGE_SIZE, authorPagePath, categoryPagePath, clampDescription } from "@/lib/articles/seo";
import { authorProfileJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { PLATFORM_MAP, resolvePlatformUrl } from "@/lib/social-links";
import { initialOf } from "@/lib/utils";
import { VIEWER_INSTITUTION_SLUG } from "@/lib/viewer";

type AuthorInfo = {
  kind: "Person" | "Organization";
  username: string;
  name: string;
  bio: string | null;
  headline: string | null;
  college: string | null;
  branch: string | null;
  avatarUrl: string | null;
  sameAs: string[];
  where: ReturnType<typeof editorialArticlesWhere>;
};

/**
 * Resolves /authors/<username>. Only members with at least one published,
 * indexable article under their own byline get a page; everyone else 404s, so
 * student profiles never become public through this route.
 */
const loadAuthor = cache(async (username: string): Promise<AuthorInfo | null> => {
  if (username === EDITORIAL_USERNAME) {
    return {
      kind: "Organization",
      username,
      name: EDITORIAL_NAME,
      bio: EDITORIAL_BIO,
      headline: "Guides on student life, money, health, travel and careers",
      college: null,
      branch: null,
      avatarUrl: "/logo.png",
      sameAs: [],
      where: editorialArticlesWhere(),
    };
  }
  if (!/^[a-zA-Z0-9_.]{1,40}$/.test(username)) return null;

  const profile = await getDb().query.userProfiles.findFirst({
    where: and(eq(userProfiles.username, username), eq(userProfiles.status, "ACTIVE")),
    columns: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      headline: true,
      bio: true,
      branch: true,
      socialLinks: true,
    },
    with: { institution: { columns: { name: true, slug: true } } },
  });
  if (!profile) return null;

  const sameAs = Object.entries(profile.socialLinks?.platforms ?? {})
    .map(([key, raw]) => {
      const platform = PLATFORM_MAP[key];
      return platform && raw ? resolvePlatformUrl(platform, raw) : null;
    })
    .filter((u): u is string => Boolean(u));

  const institution = profile.institution;
  const college =
    institution && institution.slug !== VIEWER_INSTITUTION_SLUG && !/viewer hub/i.test(institution.name)
      ? institution.name.split(",")[0]
      : null;

  return {
    kind: "Person",
    username: profile.username,
    name: profile.displayName || `@${profile.username}`,
    bio: profile.bio,
    headline: profile.headline,
    college,
    branch: profile.branch,
    avatarUrl: profile.avatarUrl,
    sameAs,
    where: personArticlesWhere(profile.id),
  };
});

const loadAuthorPage = cache(async (username: string, page: number) => {
  const author = await loadAuthor(username);
  if (!author) return null;
  const [list, topics] = await Promise.all([
    listArticles(author.where, page, ARTICLE_CATEGORY_PAGE_SIZE),
    categoryCounts(author.where),
  ]);
  if (list.total === 0 || page > list.totalPages) return null;
  return { author, list, topics };
});

export async function authorHubMetadata(username: string, page: number): Promise<Metadata> {
  const data = await loadAuthorPage(username, page);
  if (!data) notFound();
  const { author, list } = data;
  const title = `${author.name}: articles on CampusLoop${page > 1 ? ` (page ${page})` : ""}`;
  const description = clampDescription(
    author.bio ||
      `${list.total} ${list.total === 1 ? "article" : "articles"} by ${author.name}${author.college ? ` from ${author.college}` : ""} for college students on CampusLoop.`
  );
  return buildMetadata({
    title,
    description,
    path: authorPagePath(author.username, page),
    type: "profile",
    image: author.avatarUrl && author.kind === "Person" ? { url: author.avatarUrl, alt: author.name } : undefined,
  });
}

export async function AuthorHub({ username, page }: { username: string; page: number }) {
  const data = await loadAuthorPage(username, page);
  if (!data) notFound();
  const { author, list, topics } = data;
  const topicLabels = topics.slice(0, 8).map((t) => getCategoryMeta(t.category));
  const role = [author.branch, author.college].filter(Boolean).join(" · ");

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Articles", path: "/articles" },
            { name: author.name, path: authorPagePath(author.username) },
          ]),
          authorProfileJsonLd({
            kind: author.kind,
            name: author.name,
            path: authorPagePath(author.username),
            description: author.bio,
            image: author.avatarUrl,
            jobTitle: author.headline,
            affiliation: author.college,
            sameAs: author.sameAs,
            knowsAbout: topicLabels.map((t) => t.label),
          }),
        ]}
      />
      <div className="mx-auto max-w-3xl space-y-8 pb-32 pt-4 sm:pt-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar className="size-20 shrink-0">
            <AvatarImage src={author.avatarUrl || ""} alt="" />
            <AvatarFallback className="bg-surface-muted text-2xl font-semibold text-fg">
              {initialOf(author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <h1 className="text-[2rem] leading-[1.1] text-fg text-balance sm:text-4xl">{author.name}</h1>
            {author.headline && <p className="text-base font-medium text-fg">{author.headline}</p>}
            {role && <p className="text-sm text-fg-muted">{role}</p>}
            {author.bio && <p className="max-w-[68ch] text-base text-fg-muted">{author.bio}</p>}
            <p className="text-sm text-fg-muted tabular-nums">
              {list.total} {list.total === 1 ? "article" : "articles"} published
            </p>
          </div>
        </header>

        {topicLabels.length > 0 && (
          <section aria-labelledby="author-topics" className="space-y-3">
            <h2 id="author-topics" className="text-xl text-fg">
              Writes about
            </h2>
            <ul className="flex flex-wrap gap-2">
              {topicLabels.map((t) => (
                <li key={t.key}>
                  <Link
                    href={categoryPagePath(t.slug)}
                    className="inline-flex h-11 items-center rounded-full bg-surface-muted px-4 text-sm font-medium text-fg-muted transition-ui hover:bg-surface-sunken hover:text-fg"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="author-articles" className="space-y-1">
          <h2 id="author-articles" className="text-xl text-fg">
            {page > 1 ? `Articles, page ${page}` : "Articles"}
          </h2>
          <ArticleLinkList items={list.rows} />
          <PageLinks
            page={page}
            totalPages={list.totalPages}
            hrefFor={(n) => authorPagePath(author.username, n)}
          />
        </section>

        {page === 1 && author.sameAs.length > 0 && (
          <section aria-labelledby="author-elsewhere" className="space-y-2 border-t border-border pt-8">
            <h2 id="author-elsewhere" className="text-xl text-fg">
              Elsewhere
            </h2>
            <ul className="space-y-1">
              {author.sameAs.map((url) => (
                <li key={url}>
                  <a href={url} rel="me noopener" target="_blank" className="text-brand-text hover:underline">
                    {url.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
