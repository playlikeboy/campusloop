import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CommunityHeader } from "@/components/communities/community-header";
import { CommunitySettingsClient } from "@/components/communities/community-settings-client";
import { getCachedAuthUser, getCachedCommunitySummary, getCachedUserProfile } from "@/lib/server-cache";
import { getCommunityMembership } from "@/lib/communities/queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const comm = await getCachedCommunitySummary(id);

  if (!comm) {
    return {
      title: "Community Settings",
    };
  }

  return {
    title: `c/${comm.name} Settings & Moderation | CampusLoop`,
    description: `Manage privacy, anonymous posting permissions, and guidelines for c/${comm.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function CommunitySettingsPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCachedAuthUser();
  if (!user) redirect("/handler/sign-in");

  // Parallelize user profile and community lookup with request cache
  const [profile, comm] = await Promise.all([
    getCachedUserProfile(user.id),
    getCachedCommunitySummary(id),
  ]);

  if (!profile) redirect("/app/onboarding");
  if (!comm) notFound();

  const userMembership = await getCommunityMembership(comm.id, profile.id);
  const isMember = userMembership?.status === "ACTIVE";
  const isAdmin = Boolean(comm.creatorId === profile.id || userMembership?.role === "ADMIN");

  // If not admin, redirect to community page
  if (!isAdmin) {
    redirect(`/app/communities/${comm.slug || comm.id}`);
  }

  const postsCount = comm.postCount;
  const activeMembersCount = comm.memberCount;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col min-h-screen bg-background text-foreground pb-24 border-x border-border/30 select-none">
      <CommunityHeader
        community={comm}
        membersCount={activeMembersCount}
        postsCount={postsCount}
        isMember={isMember}
        isAdmin={isAdmin}
        memberStatus={userMembership?.status || "NONE"}
      />

      <div className="px-4 sm:px-5 py-4">
        <CommunitySettingsClient
          community={{
            id: comm.id,
            slug: comm.slug,
            name: comm.name,
            description: comm.description,
            category: comm.category,
            privacy: comm.privacy,
            allowAnonymousPosts: comm.allowAnonymousPosts,
            rules: comm.rules,
          }}
        />
      </div>
    </main>
  );
}
