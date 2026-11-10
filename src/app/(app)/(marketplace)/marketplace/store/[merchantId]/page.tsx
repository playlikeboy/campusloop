import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { StoreClient } from "./store-client";

interface StorePageProps {
  params: Promise<{ merchantId: string }>;
}

export const metadata: Metadata = privateMetadata("Store");

export default async function StorePage({ params }: StorePageProps) {
  const { merchantId } = await params;
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <StoreClient merchantId={merchantId} profileId={profile.id} />;
}
