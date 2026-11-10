import { redirect } from "next/navigation";
import { MyLearningClient } from "@/components/courses/my-learning-client";
import { currentProfile } from "@/lib/courses/server";
import { privateMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = privateMetadata("My learning");

export default async function MyLearningPage() {
  if (!(await currentProfile())) redirect("/sign-in?returnTo=/courses/my");
  return <MyLearningClient />;
}
