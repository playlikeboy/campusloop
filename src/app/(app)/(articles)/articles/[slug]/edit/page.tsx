import { eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArticleEditorClient } from "@/app/(app)/(articles)/articles/new/article-editor-client";
import { getDb } from "@/db";
import { articles, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

interface ArticleEditPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Edit Article",
};

export default async function ArticleEditPage({ params }: ArticleEditPageProps) {
  const { slug } = await params;
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  if (!profile) {
    redirect("/onboarding");
  }

  const article = await db.query.articles.findFirst({
    where: or(eq(articles.slug, slug), eq(articles.id, slug)),
    with: { author: true },
  });

  if (!article) {
    notFound();
  }

  // Strict ownership check
  if (article.authorId !== profile.id && profile.role !== "ADMIN") {
    redirect(`/articles/${article.slug}`);
  }

  return (
    <ArticleEditorClient
      initialArticle={{
        id: article.id,
        slug: article.slug,
        title: article.title,
        subtitle: article.subtitle,
        content: article.content,
        coverImageUrl: article.coverImageUrl,
        category: article.category,
        tags: article.tags,
        status: article.status,
      }}
      currentProfile={profile}
      isEditing={true}
    />
  );
}
