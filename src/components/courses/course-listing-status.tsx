import { Check, EyeOff, Rocket } from "lucide-react";
import type { Course } from "@/db/schema";
import { promotionProgress } from "@/lib/courses/promotion";
import { cn } from "@/lib/utils";

/** Shown to a community course's creator: where the course is visible and what promotes it to the catalog. */
export function CourseListingStatus({ course }: { course: Course }) {
  if (course.source !== "COMMUNITY" || course.status !== "PUBLISHED") return null;
  if (course.listed) {
    return (
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
        <Rocket className="size-4" aria-hidden /> Listed in the /courses catalog
      </p>
    );
  }
  const steps = promotionProgress(course);
  return (
    <section className="mt-4 rounded-2xl bg-muted/50 p-4" aria-label="Catalog listing progress">
      <p className="flex items-center gap-2 text-sm font-bold text-foreground">
        <EyeOff className="size-4" aria-hidden /> Unlisted: shown in campus feeds, not yet in the catalog
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Share the link and keep improving it. It joins /courses automatically once it clears every bar below.</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((s) => (
          <li key={s.label} className={cn("rounded-xl bg-background/70 px-3 py-2", s.done && "ring-1 ring-primary/40")}>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">{s.done && <Check className="size-3.5 text-primary" aria-hidden />}{s.label}</p>
            <p className="text-sm font-bold tabular-nums text-foreground">
              {s.current}
              <span className="font-medium text-muted-foreground"> / {s.label === "Rating" ? `${s.target}+` : s.target}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
