import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessengerView } from "@/components/chat/messenger-view";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = privateMetadata("Chats");

interface ChatPageProps {
  searchParams: Promise<{
    userId?: string;
  }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  const resolvedParams = await searchParams;
  const targetUserId = resolvedParams?.userId;

  return <MessengerView currentUserId={profile.id} initialTargetUserId={targetUserId} />;
}
