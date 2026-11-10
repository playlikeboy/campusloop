import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyLearningClient } from "@/components/courses/my-learning-client";
import { currentProfile } from "@/lib/courses/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My learning", robots: { index: false } };

export default async function MyLearningPage() {
  if (!(await currentProfile())) redirect("/sign-in?returnTo=/courses/my");
  return <MyLearningClient />;
}
