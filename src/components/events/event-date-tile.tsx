import { cn } from "@/lib/utils";

/** Calendar-page date tile: violet month strip over a big day number. */
export function EventDateTile({
  date,
  size = "md",
  className,
}: {
  date: string | Date;
  size?: "md" | "lg";
  className?: string;
}) {
  const d = new Date(date);
  const valid = !Number.isNaN(d.getTime());
  const month = valid ? d.toLocaleDateString("en-IN", { month: "short" }) : "TBA";
  const day = valid ? String(d.getDate()) : "--";

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col overflow-hidden rounded-sm border border-sticker-border bg-sticker text-center",
        size === "lg" ? "w-20" : "w-16",
        className
      )}
    >
      <span className="bg-sticker-header py-0.5 text-xs font-semibold text-sticker-header-fg">{month}</span>
      <time
        dateTime={valid ? d.toISOString() : undefined}
        className={cn(
          "font-display font-extrabold tabular-nums text-sticker-fg",
          size === "lg" ? "py-2 text-3xl" : "py-1.5 text-2xl"
        )}
      >
        {day}
      </time>
    </div>
  );
}
