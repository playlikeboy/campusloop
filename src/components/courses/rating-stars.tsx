import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating with an accessible label. */
export function RatingStars({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "md" }) {
  const px = size === "md" ? "size-4" : "size-3.5";
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rated ${value.toFixed(1)} out of 5${count !== undefined ? ` by ${count} learners` : ""}`}>
      {value > 0 && <span className="text-sm font-bold tabular-nums text-amber-700 dark:text-amber-400">{value.toFixed(1)}</span>}
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn(px, i <= Math.round(value) ? "fill-amber-500 text-amber-500" : "fill-muted text-muted")} />
        ))}
      </span>
      {count !== undefined && <span className="text-xs text-muted-foreground">({count.toLocaleString("en-IN")})</span>}
    </span>
  );
}
