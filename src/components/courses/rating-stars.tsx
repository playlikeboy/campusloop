import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating with an accessible label. Stars use ink: yellow is kept for Loop Points. */
export function RatingStars({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const px = size === "md" ? "size-4" : "size-3.5";
  return (
    <span
      role="img"
      className="inline-flex items-center gap-1"
      aria-label={`Rated ${value.toFixed(1)} out of 5${count !== undefined ? ` by ${count} learners` : ""}`}
    >
      {value > 0 && <span className="text-sm font-bold tabular-nums text-fg">{value.toFixed(1)}</span>}
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(px, "fill-current", i <= Math.round(value) ? "text-fg" : "text-border-strong")}
          />
        ))}
      </span>
      {count !== undefined && (
        <span className="text-xs tabular-nums text-fg-muted">({count.toLocaleString("en-IN")})</span>
      )}
    </span>
  );
}
