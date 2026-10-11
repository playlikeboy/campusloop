import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { isViewerProfile } from "@/lib/viewer";
import { StoryCreator } from "./story-creator";

export const metadata: Metadata = {
  title: "Create Story",
};

interface CreateStoryPageProps {
  searchParams: Promise<{ text?: string; media?: string }>;
}

export default async function CreateStoryPage({ searchParams }: CreateStoryPageProps) {
  const { text, media } = await searchParams;
  let initialMediaUrl: string | null = null;
  if (media) {
    try {
      const parsed = new URL(media);
      if (parsed.protocol === "https:") initialMediaUrl = parsed.toString();
    } catch {
      // Ignore malformed or non-HTTPS prefill URLs.
    }
  }

  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
    with: {
      institution: true,
    },
  });

  if (!profile) {
    redirect("/onboarding");
  }

  if (await isViewerProfile(profile)) {
    redirect("/feeds");
  }

  return (
    <StoryCreator
      profile={profile}
      initialText={typeof text === "string" ? text.slice(0, 160) : ""}
      initialMediaUrl={initialMediaUrl}
    />
  );
}
