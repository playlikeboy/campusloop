import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewLostFoundClient } from "./new-lost-found-client";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "Report Lost or Found Item | Campus Recovery",
  description:
    "Report lost IDs, keys, earphones, cycles, or report found items to verified students across your college.",
  alternates: { canonical: "https://campusloop.space/lost-and-found/new" },
};

export default async function NewLostAndFoundPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return (
    <NewLostFoundClient
      profileId={profile.id}
      defaultCampusName={profile.institution?.name || "Campus"}
    />
  );
}
