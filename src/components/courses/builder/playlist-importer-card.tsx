"use client";

import { CheckCircle2, Download, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImportedPlaylistResult } from "@/lib/courses/playlist-importer";
import { lectureCount } from "../lecture-kind";

interface PlaylistImporterCardProps {
  onImport: (imported: ImportedPlaylistResult) => void;
  disabled?: boolean;
}

const FALLBACK_ERROR = "Couldn't import that link. Check it's a public playlist or folder and try again.";

/** Paste a playlist or folder link to fill in the course and its lectures. */
export function PlaylistImporterCard({ onImport, disabled }: PlaylistImporterCardProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState<{ count: number; title: string } | null>(null);

  async function handleImport() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      let res = await fetch("/api/courses/import-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (res.status === 404 || res.status === 405) {
        res = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "import-playlist", url: trimmed }),
        });
      }
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        course?: ImportedPlaylistResult;
      };
      if (!res.ok || !data.success || !data.course) throw new Error(data.error || FALLBACK_ERROR);

      onImport(data.course);
      setImported({ count: data.course.itemCount, title: data.course.title });
      toast.success(`Added ${lectureCount(data.course.itemCount)}`, {
        description: "Check the titles below, then publish.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : FALLBACK_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="import-playlist" className="rounded-lg border border-border bg-surface p-5">
      <h2 id="import-playlist" className="text-lg text-fg">
        Import a playlist
      </h2>
      <p className="mt-1 text-sm text-fg-muted">
        Paste a YouTube, Dailymotion, Archive.org or Google Drive link. We fill in the lectures for you.
      </p>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          handleImport();
        }}
      >
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="Playlist or folder link"
          placeholder="https://www.youtube.com/playlist?list=..."
          disabled={loading || disabled}
          className="flex-1"
        />
        <Button type="submit" loading={loading} disabled={!url.trim() || disabled} className="shrink-0">
          {!loading && <Download aria-hidden />}
          {loading ? "Importing" : "Import"}
        </Button>
      </form>

      {imported && (
        <div
          className="mt-3 flex items-start gap-2 rounded-md bg-verified-subtle px-3 py-2.5 text-sm text-verified-text"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="min-w-0 flex-1">
            Added {lectureCount(imported.count)} from "{imported.title}". You can edit anything below.
          </p>
          <button
            type="button"
            onClick={() => setImported(null)}
            aria-label="Hide this message"
            className="-my-2.5 -mr-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-ui hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </section>
  );
}
