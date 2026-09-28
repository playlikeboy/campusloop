import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ARTICLES_CANONICAL_HOST } from "@/constants/articles";
import { getDb } from "@/db";
import { articles } from "@/db/schema";

interface ArticleShortLinkProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticleShortLinkProps): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const article = await db.query.articles.findFirst({
    where: eq(articles.slug, slug),
  });

  if (!article) {
    return { title: "Article Not Found" };
  }

  const title = article.title;
  const description = article.excerpt || article.subtitle || "Read student articles on CampusLoop.";
  const canonicalUrl = `${ARTICLES_CANONICAL_HOST}/articles/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: article.coverImageUrl
        ? [{ url: article.coverImageUrl }]
        : [{ url: `${ARTICLES_CANONICAL_HOST}/og-image.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.coverImageUrl ? [article.coverImageUrl] : [`${ARTICLES_CANONICAL_HOST}/og-image.png`],
    },
  };
}

/**
 * Short URL share route.
 * Redirects to the canonical `/articles/[slug]` publication route.
 */
export default async function ArticleShortLinkPage({ params }: ArticleShortLinkProps) {
  const { slug } = await params;
  redirect(`/articles/${slug}`);
}
