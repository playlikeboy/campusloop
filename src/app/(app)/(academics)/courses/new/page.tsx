import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CourseBuilder } from "@/components/courses/builder/course-builder";
import { currentProfile } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create a Course",
  description: "Build a free course from YouTube, Vimeo or your own videos, articles and links. Learners get progress tracking, notes, Q&A and certificates.",
  alternates: { canonical: "https://campusloop.space/courses/new" },
  robots: { index: false, follow: false },
};

export default async function NewCoursePage() {
  if (!(await currentProfile())) redirect("/sign-in?returnTo=/courses/new");
  return <CourseBuilder />;
}
