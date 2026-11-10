"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { type CrushSearchUser, initials } from "./crush-types";

interface CrushSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** People already on the list; hidden from results. */
  excludeIds: Set<string>;
  submitting: boolean;
  onPick: (user: CrushSearchUser) => Promise<boolean>;
}

/** Find a student by name or @username and add them as a secret crush. */
export function CrushSearchDialog({
  open,
  onOpenChange,
  excludeIds,
  submitting,
  onPick,
}: CrushSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CrushSearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setFailed(false);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    latest.current = q;
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/chat/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error();
        const users = (await res.json()) as CrushSearchUser[];
        if (latest.current !== q) return;
        setResults(users);
        setFailed(false);
      } catch {
        if (latest.current === q) setFailed(true);
      } finally {
        if (latest.current === q) setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const visible = results.filter((u) => !excludeIds.has(u.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] max-w-md flex-col">
        <DialogHeader>
          <DialogTitle>Add a secret crush</DialogTitle>
          <DialogDescription>They only find out if they add you too.</DialogDescription>
        </DialogHeader>

        <label className="relative block">
          <span className="sr-only">Search by name or username</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or @username"
            className="pl-10"
            autoFocus
          />
        </label>

        <div className="mt-3 max-h-72 min-h-36 overflow-y-auto overscroll-contain" aria-live="polite">
          {searching ? (
            <div className="flex justify-center py-10 text-fg-muted">
              <Spinner size="sm" label="Searching" />
            </div>
          ) : failed ? (
            <p className="py-10 text-center text-sm text-fg-muted">
              Search didn't work. Check your connection and try again.
            </p>
          ) : visible.length > 0 ? (
            <ul className="divide-y divide-border">
              {visible.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage src={u.avatarUrl || undefined} alt="" />
                      <AvatarFallback className="bg-crush-subtle text-sm font-semibold text-crush-text">
                        {initials(u.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-fg">{u.displayName}</p>
                      <p className="truncate text-xs text-fg-muted">@{u.username}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={submitting}
                    onClick={async () => {
                      if (await onPick(u)) onOpenChange(false);
                    }}
                    aria-label={`Add ${u.displayName} as a secret crush`}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <p className="py-10 text-center text-sm text-fg-muted">No one found for "{query.trim()}".</p>
          ) : (
            <p className="py-10 text-center text-sm text-fg-muted">Type a name to search.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
