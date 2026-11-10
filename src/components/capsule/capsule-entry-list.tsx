"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo, getAvatarUrl, initialOf } from "@/lib/utils";
import { CAPSULE_ENTRY_LABELS } from "./capsule-labels";

type CapsuleEntry = any;

/** Your own entries in a capsule that is still closed. Only you can see them. */
export function MySealedEntries({ entries }: { entries: CapsuleEntry[] }) {
  return (
    <div className="space-y-2 rounded-md bg-surface-muted p-3">
      <p className="text-sm font-medium text-fg">
        You added {entries.length} {entries.length === 1 ? "entry" : "entries"}. Only you can see{" "}
        {entries.length === 1 ? "it" : "them"} until it opens.
      </p>
      <ul className="space-y-1.5">
        {entries.map((e) => (
          <li key={e.id} className="rounded-sm bg-surface p-2.5 text-sm">
            <p className="font-semibold text-fg">{e.title}</p>
            <p className="mt-0.5 line-clamp-1 text-fg-muted">{e.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Everything people added, shown once the capsule is open. */
export function OpenedEntries({ entries }: { entries: CapsuleEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-fg-muted">Nobody added anything to this capsule.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {entries.map((entry) => (
        <li key={entry.id} className="space-y-1.5 py-3 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              {entry.author ? (
                <>
                  <Avatar className="size-6">
                    <AvatarImage src={getAvatarUrl(entry.author.avatarUrl, entry.author.username)} alt="" />
                    <AvatarFallback className="text-xs">{initialOf(entry.author.displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate font-semibold text-fg">{entry.author.displayName}</span>
                </>
              ) : (
                <span className="truncate font-semibold text-fg">@{entry.pseudonym || "anonymous"}</span>
              )}
              <span className="shrink-0 text-xs text-fg-subtle">{formatTimeAgo(entry.createdAt)}</span>
            </div>
            <Badge variant="neutral">{CAPSULE_ENTRY_LABELS[entry.entryType] ?? entry.entryType}</Badge>
          </div>

          <p className="text-sm font-semibold text-fg">{entry.title}</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{entry.content}</p>

          {entry.mediaUrl && (
            <img
              src={entry.mediaUrl}
              alt={entry.title}
              loading="lazy"
              className="mt-2 max-h-64 w-full rounded-md border border-border object-cover"
            />
          )}
        </li>
      ))}
    </ul>
  );
}
