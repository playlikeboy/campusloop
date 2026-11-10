import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessengerView } from "@/components/chat/messenger-view";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = privateMetadata("Chat");

interface DirectChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DirectChatPage({ params }: DirectChatPageProps) {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  const resolved = await params;
  const conversationId = resolved.id;

  return <MessengerView currentUserId={profile.id} initialConversationId={conversationId} />;
}
