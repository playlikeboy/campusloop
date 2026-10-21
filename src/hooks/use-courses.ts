"use client";

import useSWR from "swr";
import type { Course, CourseLecture, CourseSection } from "@/db/schema";
import { fetcher } from "@/lib/api";
import type { ViewerCourseState } from "@/lib/courses/server";

export interface CourseDetailResponse {
  course: Course;
  sections: (CourseSection & { lectures: CourseLecture[] })[];
  lectures: CourseLecture[];
  creator: { username: string; displayName: string; avatarUrl: string | null } | null;
  viewer: ViewerCourseState;
  canEdit: boolean;
}

export function useCourse(slug: string, fallback?: CourseDetailResponse) {
  return useSWR<CourseDetailResponse>(`/api/courses/${slug}`, fetcher, { fallbackData: fallback, revalidateOnFocus: false });
}

export interface MyLearningResponse {
  learning: { course: Course; enrolledAt: string; completedAt: string | null; lastLectureId: string | null; completedLectures: number }[];
  certificates: { id: string; courseTitle: string; issuedAt: string; slug: string }[];
  wishlist: Course[];
}

export function useMyLearning(enabled = true) {
  return useSWR<MyLearningResponse>(enabled ? "/api/courses/my" : null, fetcher);
}

/** POST/DELETE JSON helper for course actions; throws with the API's error message. */
export async function courseAction<T = unknown>(url: string, body?: unknown, method: "POST" | "DELETE" | "PATCH" = "POST"): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}
