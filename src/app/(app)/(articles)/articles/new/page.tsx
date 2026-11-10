import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { privateMetadata } from "@/lib/seo";
import { ArticleEditorClient } from "./article-editor-client";

export const metadata: Metadata = privateMetadata("Write an article");

export default async function NewArticlePage() {
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

  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-fg-muted">Loading the editor…</p>}>
      <ArticleEditorClient currentProfile={profile} />
    </Suspense>
  );
}
