"use client";

import { Bookmark, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { StoryArchiveModal } from "./story-archive-modal";

interface HighlightItem {
  id: string;
  title: string;
  coverUrl: string | null;
  storiesCount?: number;
  stories?: any[];
}

const fetcher = async (url: string): Promise<HighlightItem[]> => {
  const res = await fetch(url);
  return res.json() as Promise<HighlightItem[]>;
};

interface ProfileHighlightsProps {
  userId: string;
  username: string;
  isOwnProfile: boolean;
}

export function ProfileHighlights({ userId, isOwnProfile }: ProfileHighlightsProps) {
  const router = useRouter();
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const { data: highlights, mutate: mutateHighlights } = useSWR<HighlightItem[]>(
    `/api/highlights?userId=${userId}`,
    fetcher
  );

  function handleOpenHighlight(h: HighlightItem) {
    if (h.stories && h.stories.length > 0) {
      router.push(`/story/${h.stories[0].id}`);
    } else {
      toast.info(`"${h.title}" has no stories yet.`);
    }
  }

  const hasHighlights = highlights && highlights.length > 0;

  if (!hasHighlights && !isOwnProfile) {
    return null;
  }

  return (
    <div className="px-4 py-2">
      <ul className="no-scrollbar flex items-start gap-3 overflow-x-auto py-1" aria-label="Highlights">
        {isOwnProfile && (
          <li className="flex shrink-0 flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setShowArchiveModal(true)}
              className="flex size-16 cursor-pointer items-center justify-center rounded-full border border-dashed border-border-strong text-fg-muted transition-ui hover:border-brand hover:text-brand-text active:scale-95"
              aria-label="Make a new highlight"
            >
              <Plus aria-hidden="true" className="size-5" />
            </button>
            <span className="text-xs text-fg-muted">New</span>
          </li>
        )}

        {hasHighlights &&
          highlights.map((h) => (
            <li key={h.id} className="flex shrink-0 flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => handleOpenHighlight(h)}
                className="size-16 cursor-pointer rounded-full border-2 border-brand p-0.5 transition-ui active:scale-95"
                aria-label={`Open highlight ${h.title}`}
              >
                <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-surface-muted">
                  {h.coverUrl ? (
                    <img src={h.coverUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <Bookmark aria-hidden="true" className="size-5 text-fg-muted" />
                  )}
                </span>
              </button>
              <span className="max-w-16 truncate text-center text-xs text-fg">{h.title}</span>
            </li>
          ))}
      </ul>

      {/* Story Archive & New Highlight Modal */}
      {showArchiveModal && (
        <StoryArchiveModal
          isOpen={showArchiveModal}
          onClose={() => setShowArchiveModal(false)}
          onHighlightCreated={() => {
            mutateHighlights();
            setShowArchiveModal(false);
          }}
        />
      )}
    </div>
  );
}
