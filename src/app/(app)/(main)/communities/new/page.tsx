import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateCommunityClient } from "@/components/communities/create-community-client";
import { hexclaveServerApp } from "@/hexclave/server";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Start a community");

export default async function NewCommunityPage() {
  const user = await hexclaveServerApp.getUser();
  if (!user) redirect("/sign-in");

  return <CreateCommunityClient />;
}
