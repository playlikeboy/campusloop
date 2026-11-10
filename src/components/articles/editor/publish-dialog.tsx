"use client";

import { Send, Shuffle, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fieldClassName, Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ARTICLE_CATEGORY_LIST } from "@/constants/articles";
import { cn } from "@/lib/utils";

const SUGGESTED_TAGS = [
  "placements",
  "internships",
  "dsa",
  "webdev",
  "campuslife",
  "research",
  "interview",
  "opensource",
];
const MAX_TAGS = 6;

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  coverImageUrl: string;
  onCoverChange: (url: string) => void;
  onUploadCover: () => void;
  onGenerateCover: () => void;
  onPublish: () => void;
  publishing: boolean;
  isEditing: boolean;
}

/** Last step before publishing: topic, tags and cover. */
export function PublishDialog({
  open,
  onOpenChange,
  category,
  onCategoryChange,
  tags,
  onTagsChange,
  coverImageUrl,
  onCoverChange,
  onUploadCover,
  onGenerateCover,
  onPublish,
  publishing,
  isEditing,
}: PublishDialogProps) {
  const [tagInput, setTagInput] = useState("");

  function addTag(raw: string) {
    const clean = raw.trim().replace(/^#/, "").toLowerCase();
    if (!clean || tags.includes(clean)) return;
    if (tags.length >= MAX_TAGS) {
      toast.error(`You can add up to ${MAX_TAGS} tags. Remove one to add another.`);
      return;
    }
    onTagsChange([...tags, clean]);
    setTagInput("");
  }

  const suggestions = SUGGESTED_TAGS.filter((t) => !tags.includes(t));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Update your article" : "Ready to publish?"}</DialogTitle>
          <DialogDescription>Pick a topic and a few tags so the right people find it.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="article-category">Topic</Label>
            <select
              id="article-category"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className={cn(fieldClassName, "h-11 w-full")}
            >
              {ARTICLE_CATEGORY_LIST.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-tag">
              Tags <span className="font-normal text-fg-muted">(up to {MAX_TAGS})</span>
            </Label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addTag(tagInput);
              }}
              className="flex gap-2"
            >
              <Input
                id="article-tag"
                placeholder="placements"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
              <Button type="submit" variant="outline" disabled={!tagInput.trim()}>
                Add
              </Button>
            </form>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Chip key={t} size="sm" selected onRemove={() => onTagsChange(tags.filter((x) => x !== t))}>
                    #{t}
                  </Chip>
                ))}
              </div>
            )}
            {suggestions.length > 0 && tags.length < MAX_TAGS && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((st) => (
                  <Chip key={st} size="sm" onClick={() => addTag(st)}>
                    #{st}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-cover">Cover image</Label>
            <Input
              id="article-cover"
              type="url"
              placeholder="Paste an image link (https://…)"
              value={coverImageUrl}
              onChange={(e) => onCoverChange(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onUploadCover}>
                <Upload className="size-4" />
                Upload
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onGenerateCover}>
                <Shuffle className="size-4" />
                Random pattern
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep editing
          </Button>
          <Button onClick={onPublish} loading={publishing}>
            <Send className="size-4" />
            {isEditing ? "Publish changes" : "Publish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
