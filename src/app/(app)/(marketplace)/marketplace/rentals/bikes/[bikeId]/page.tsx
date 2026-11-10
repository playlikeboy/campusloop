import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { BikeDetailClient } from "./bike-detail-client";

interface BikeDetailPageProps {
  params: Promise<{ bikeId: string }>;
}

export const metadata: Metadata = privateMetadata("Bike details");

export default async function BikeDetailPage({ params }: BikeDetailPageProps) {
  const { bikeId } = await params;
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <BikeDetailClient bikeId={bikeId} profileId={profile.id} />;
}
