"use client";

import {
  BookOpen,
  Camera,
  Check,
  Code2,
  ExternalLink,
  Flame,
  Laptop,
  Mic,
  Music,
  School,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { pingUnsplashDownload, useUnsplashSearch } from "@/hooks/use-unsplash";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import type { UnsplashPhoto } from "@/lib/unsplash";
import { cn } from "@/lib/utils";

export interface SelectedUnsplashPhoto {
  url: string;
  thumbUrl: string;
  alt: string;
  photographerName: string;
  photographerUrl: string;
}

interface UnsplashImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (photo: SelectedUnsplashPhoto) => void;
  defaultQuery?: string;
  orientation?: "landscape" | "portrait" | "squarish" | "all";
  title?: string;
}

const POPULAR_TOPICS = [
  { id: "hackathon", label: "Hackathon", icon: Code2 },
  { id: "college fest", label: "Fest", icon: Sparkles },
  { id: "coding developer", label: "Coding", icon: Laptop },
  { id: "tech workshop", label: "Workshop", icon: BookOpen },
  { id: "university campus", label: "Campus", icon: School },
  { id: "college party concert", label: "Music", icon: Music },
  { id: "esports gaming", label: "Esports", icon: Flame },
  { id: "conference seminar", label: "Seminar", icon: Mic },
];

export function UnsplashImagePicker({
  isOpen,
  onClose,
  onSelect,
  defaultQuery = "hackathon",
  orientation = "landscape",
  title = "Choose a cover photo",
}: UnsplashImagePickerProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [activeTopic, setActiveTopic] = useState<string>(defaultQuery);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  const { photos, isLoading } = useUnsplashSearch({
    query: query || "campus",
    orientation,
    perPage: 16,
    enabled: isOpen,
  });

  function handleTopicClick(topic: string) {
    sounds.tap();
    haptics.light();
    setActiveTopic(topic);
    setQuery(topic);
  }

  function handlePhotoSelect(photo: UnsplashPhoto) {
    sounds.pop();
    haptics.medium();
    setSelectedPhotoId(photo.id);

    // Track download ping per Unsplash API terms
    if (photo.downloadLocation) {
      void pingUnsplashDownload(photo.downloadLocation);
    }

    onSelect({
      url: photo.url,
      thumbUrl: photo.thumbUrl,
      alt: photo.alt,
      photographerName: photo.photographerName,
      photographerUrl: photo.photographerUrl,
    });

    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[88dvh] max-w-2xl flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Free photos from Unsplash. Tap one to use it.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
            <Input
              type="search"
              placeholder="Search photos, e.g. hackathon, library"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveTopic("");
              }}
              className="pl-10 pr-11"
              aria-label="Search photos"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveTopic("");
                }}
                className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-0.5">
            {POPULAR_TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <Chip
                  key={topic.id}
                  size="sm"
                  selected={activeTopic === topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  icon={<Icon className="size-3.5" />}
                  className="shrink-0"
                >
                  {topic.label}
                </Chip>
              );
            })}
          </div>

          <div className="min-h-[280px]">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-2.5 pt-2 sm:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton
                    key={i}
                    className={cn("rounded-md", orientation === "portrait" ? "aspect-9/16" : "aspect-16/9")}
                  />
                ))}
              </div>
            ) : photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 pt-2 sm:grid-cols-3">
                {photos.map((photo) => {
                  const isSelected = selectedPhotoId === photo.id;
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => handlePhotoSelect(photo)}
                      aria-pressed={isSelected}
                      className={cn(
                        "group relative overflow-hidden rounded-md text-left transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        orientation === "portrait" ? "aspect-9/16" : "aspect-16/9",
                        isSelected ? "ring-3 ring-brand" : "hover:opacity-90"
                      )}
                    >
                      <img
                        src={photo.thumbUrl}
                        alt={photo.alt}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                      <span className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1">
                        <span className="truncate rounded-full bg-overlay px-2 py-0.5 text-[0.6875rem] font-medium text-story-field-fg">
                          {photo.photographerName}
                        </span>
                        {isSelected && (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
                            <Check className="size-3" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                size="compact"
                icon={Camera}
                title={`No photos for "${query}"`}
                description="Try a shorter word."
                action={
                  <Button variant="secondary" size="sm" onClick={() => handleTopicClick("hackathon")}>
                    Show hackathon photos
                  </Button>
                }
              />
            )}
          </div>

          <div className="flex items-center justify-end border-t border-border pt-3 text-xs text-fg-muted">
            <a
              href="https://unsplash.com/?utm_source=campusloop&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 font-medium text-fg-muted transition-ui hover:text-brand-text"
            >
              Photos by Unsplash
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
