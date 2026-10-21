"use client";

import { Award, Bookmark, BookmarkCheck, Clock, Infinity as InfinityIcon, Loader2, Pencil, PlayCircle, Share2, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { courseAction, useCourse } from "@/hooks/use-courses";
import { formatDuration } from "@/lib/courses/format";

/** Sticky purchase-style panel: enrol / continue, wishlist, share, what's included. */
export function EnrollPanel({ slug }: { slug: string }) {
  const router = useRouter();
  const { data, mutate } = useCourse(slug);
  const [busy, setBusy] = useState(false);
  if (!data) return <div className="h-72 animate-pulse rounded-2xl bg-muted/60" />;
  const { course, viewer, lectures, canEdit } = data;
  const progress = lectures.length ? Math.round((viewer.completedIds.length / lectures.length) * 100) : 0;
  const resume = viewer.lastLectureId ?? lectures.find((l) => !viewer.completedIds.includes(l.id))?.id ?? lectures[0]?.id;

  async function enroll() {
    setBusy(true);
    try {
      await courseAction(`/api/courses/${slug}/enroll`);
      await mutate();
      router.push(`/learn/${slug}/${lectures[0]?.id ?? ""}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not enrol";
      if (msg.startsWith("Sign in")) router.push(`/sign-in?returnTo=/courses/${slug}`);
      else toast.error(msg);
      setBusy(false);
    }
  }

  async function wishlist() {
    try {
      const r = await courseAction<{ wishlisted: boolean }>(`/api/courses/${slug}/wishlist`);
      await mutate();
      toast.success(r.wishlisted ? "Saved to wishlist" : "Removed from wishlist");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign in to save courses");
    }
  }

  async function share() {
    const url = `${window.location.origin}/courses/${slug}`;
    if (navigator.share) await navigator.share({ title: course.title, url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Link copied");
    }
  }

  return (
    <div className="rounded-2xl bg-card/80 p-5 shadow-sm">
      <p className="text-2xl font-black text-foreground">Free</p>
      {viewer.enrolled ? (
        <>
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{progress}% complete · {viewer.completedIds.length}/{lectures.length} lectures</p>
          </div>
          <Link href={`/learn/${slug}/${resume}`} className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground hover:opacity-90">
            <PlayCircle className="size-5" aria-hidden /> {progress > 0 ? "Continue learning" : "Start course"}
          </Link>
        </>
      ) : (
        <button type="button" onClick={enroll} disabled={busy} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60 cursor-pointer">
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <PlayCircle className="size-5" aria-hidden />} Enrol for free
        </button>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={wishlist} className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-muted/70 text-sm font-semibold text-foreground hover:bg-muted cursor-pointer">
          {viewer.wishlisted ? <BookmarkCheck className="size-4 text-primary" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
          {viewer.wishlisted ? "Saved" : "Wishlist"}
        </button>
        <button type="button" onClick={share} className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-muted/70 text-sm font-semibold text-foreground hover:bg-muted cursor-pointer">
          <Share2 className="size-4" aria-hidden /> Share
        </button>
      </div>
      {canEdit && course.source === "COMMUNITY" && (
        <Link href={`/courses/${slug}/edit`} className="mt-2 flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10">
          <Pencil className="size-4" aria-hidden /> Edit course
        </Link>
      )}
      <p className="mt-5 text-sm font-bold text-foreground">This course includes</p>
      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2"><Clock className="size-4" aria-hidden />{formatDuration(course.durationSec)} of video in {course.lecturesCount} lectures</li>
        <li className="flex items-center gap-2"><Smartphone className="size-4" aria-hidden />Watch on phone, tablet or laptop</li>
        <li className="flex items-center gap-2"><InfinityIcon className="size-4" aria-hidden />Lifetime access, learn at your pace</li>
        <li className="flex items-center gap-2"><Award className="size-4" aria-hidden />Certificate of completion</li>
      </ul>
    </div>
  );
}
