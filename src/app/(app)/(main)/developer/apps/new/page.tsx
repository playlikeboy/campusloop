import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppForm } from "@/components/oauth/app-form";
import { getCachedAuthUser } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New app | Login with CampusLoop",
  description: "Register a website or app to add Login with CampusLoop and verify college students.",
  robots: { index: false, follow: true },
};

export default async function NewOauthAppPage() {
  const user = await getCachedAuthUser().catch(() => null);
  if (!user) redirect("/sign-in?returnTo=/developer/apps/new");
  return (
    <div className="mx-auto max-w-5xl px-4 py-4 pb-20">
      <Link href="/developer" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden /> Developer portal</Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">Register an app</h1>
      <p className="mt-1 max-w-2xl text-muted-foreground">Get a client ID for Login with CampusLoop. Sign-in, name, photo and the verified-student check work as soon as you create it.</p>
      <div className="mt-8"><AppForm /></div>
    </div>
  );
}
