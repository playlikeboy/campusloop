"use client";

import { useEffect } from "react";

/** Counts one view per course per browser session; the server dedupes per day. */
export function CourseViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `cl_course_viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    fetch(`/api/courses/${slug}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [slug]);
  return null;
}
