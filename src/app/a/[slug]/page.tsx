import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { articles } from "@/db/schema";
import { buildMetadata, ogImageUrl, privateMetadata } from "@/lib/seo";

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
    return privateMetadata("Article not found");
  }

  // Share link: preview cards use the article, the canonical points at /articles/[slug].
  return buildMetadata({
    title: article.title,
    description: article.excerpt || article.subtitle || `${article.title}, a student article on CampusLoop.`,
    path: `/articles/${article.slug}`,
    image: article.coverImageUrl
      ? { url: article.coverImageUrl, alt: article.title }
      : ogImageUrl(article.title, "Article"),
    type: "article",
  });
}

/**
 * Short URL share route.
 * Redirects to the canonical `/articles/[slug]` publication route.
 */
export default async function ArticleShortLinkPage({ params }: ArticleShortLinkProps) {
  const { slug } = await params;
  redirect(`/articles/${slug}`);
}
