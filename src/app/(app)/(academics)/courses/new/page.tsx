import { redirect } from "next/navigation";
import { CourseBuilder } from "@/components/courses/builder/course-builder";
import { currentProfile } from "@/lib/courses/server";
import { privateMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = privateMetadata("Create a course");

export default async function NewCoursePage() {
  if (!(await currentProfile())) redirect("/sign-in?returnTo=/courses/new");
  return <CourseBuilder />;
}
