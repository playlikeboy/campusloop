import Link from "next/link";
import type { DpLeaderRow } from "@/lib/play/server/dp";
import { cn } from "@/lib/utils";
import { RankTile } from "../play-ui";

/** Ranked DP entries: rank, photo, name and record. Never who voted. */
export function DpLeaderboard({ rows, compact = false }: { rows: DpLeaderRow[]; compact?: boolean }) {
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {rows.map((r) => (
        <li key={r.entryId} className={cn("flex items-center gap-3 px-4 py-2.5", r.isMe && "bg-brand-subtle")}>
          <RankTile rank={r.rank} />
          {/* eslint-disable-next-line @next/next/no-img-element -- opted-in DP */}
          <img
            src={r.imageUrl}
            alt=""
            className={cn("shrink-0 rounded-md object-cover", compact ? "size-10" : "size-12")}
            loading="lazy"
          />
          <span className="min-w-0 flex-1">
            <Link
              href={`/profile/${r.username}`}
              className="block truncate font-semibold text-fg hover:underline focus-visible:underline"
            >
              {r.displayName}
              {r.isMe && <span className="font-normal text-brand-text"> (you)</span>}
            </Link>
            <span className="block text-sm tabular-nums text-fg-muted">
              {r.wins} W · {r.losses} L
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block font-bold tabular-nums text-fg">{r.rating}</span>
            <span className="block text-xs text-fg-muted">rating</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
