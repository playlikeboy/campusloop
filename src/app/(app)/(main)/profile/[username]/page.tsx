import type { Metadata } from "next";
import { redirect } from "next/navigation";

interface ProfileDetailProps {
  params: Promise<{ username: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: ProfileDetailProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username}`,
    robots: { index: false, follow: true },
  };
}

/** Old URL. Profiles live at /@username. */
export default async function LegacyProfileRedirectPage({ params, searchParams }: ProfileDetailProps) {
  const { username } = await params;
  const search = await searchParams;
  const tab = typeof search?.tab === "string" ? search.tab : undefined;
  redirect(tab ? `/@${username}?tab=${encodeURIComponent(tab)}` : `/@${username}`);
}
