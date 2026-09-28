import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { isViewerProfile } from "@/lib/viewer";
import { ArticleEditorClient } from "./article-editor-client";

export const metadata: Metadata = {
  title: "Write Article",
  description: "Write and publish long-form student articles, placement guides, and stories on CampusLoop.",
};

export default async function NewArticlePage() {
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect("/handler/sign-in");
  }

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  if (!profile) {
    redirect("/onboarding");
  }

  const isViewer = await isViewerProfile(profile);
  if (isViewer) {
    redirect("/articles");
  }

  return (
    <Suspense
      fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading editor...</div>}
    >
      <ArticleEditorClient currentProfile={profile} />
    </Suspense>
  );
}
