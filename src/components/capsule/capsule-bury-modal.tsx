"use client";

import { FileText, Image as ImageIcon, Lightbulb } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

type EntryType = "LETTER" | "PREDICTION" | "PHOTO";

interface CapsuleBuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  capsuleId: string;
  capsuleTitle: string;
  onEntryBuried?: (entry: any) => void;
}

const PLACEHOLDERS: Record<EntryType, string> = {
  LETTER: "A note to future me",
  PREDICTION: "Who from our batch starts a company first?",
  PHOTO: "3 AM Maggi before end sems",
};

/** Add a letter, prediction or photo to a capsule. Others see it only when the capsule opens. */
export function CapsuleBuryModal({
  isOpen,
  onClose,
  capsuleId,
  capsuleTitle,
  onEntryBuried,
}: CapsuleBuryModalProps) {
  const [entryType, setEntryType] = useState<EntryType>("LETTER");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [pseudonym, setPseudonym] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Add a title and a message first.");
      return;
    }

    setIsSubmitting(true);
    sounds.tap();
    haptics.light();

    try {
      const res = await fetch(`/api/capsules/${capsuleId}/bury`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          entryType,
          mediaUrl: mediaUrl.trim() || null,
          isAnonymous,
          pseudonym: isAnonymous ? pseudonym.trim() || "anonymous_student" : null,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Couldn't save your entry. Try again.");
      }

      const { entry } = (await res.json()) as { entry: any };

      sounds.archive();
      haptics.success();
      toast.success("Added. It stays hidden until the capsule opens.");
      onEntryBuried?.(entry);
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Couldn't save your entry. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="line-clamp-2">{capsuleTitle}</DialogTitle>
          <DialogDescription>
            Others see this only when the capsule opens. Don't add anything you wouldn't want shared then.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <SegmentedControl
            aria-label="Entry type"
            fullWidth
            value={entryType}
            onChange={setEntryType}
            options={[
              { value: "LETTER", label: "Letter", icon: <FileText /> },
              { value: "PREDICTION", label: "Prediction", icon: <Lightbulb /> },
              { value: "PHOTO", label: "Photo", icon: <ImageIcon /> },
            ]}
          />

          <div className="space-y-1.5">
            <Label htmlFor="capsule-title">Title</Label>
            <Input
              id="capsule-title"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={PLACEHOLDERS[entryType]}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="capsule-content">Message</Label>
            <Textarea
              id="capsule-content"
              value={content}
              maxLength={5000}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you hope happens? What will you miss?"
              rows={4}
              required
            />
          </div>

          {entryType === "PHOTO" && (
            <div className="space-y-1.5">
              <Label htmlFor="capsule-photo">Photo link</Label>
              <Input
                id="capsule-photo"
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-md bg-surface-muted p-3">
            <div>
              <Label htmlFor="capsule-anon">Hide my name</Label>
              <p className="text-sm text-fg-muted">
                {isAnonymous ? "A nickname shows instead of your name." : "Your name shows when it opens."}
              </p>
            </div>
            <Switch
              id="capsule-anon"
              checked={isAnonymous}
              onCheckedChange={(v) => setIsAnonymous(Boolean(v))}
            />
          </div>

          {isAnonymous && (
            <div className="space-y-1.5">
              <Label htmlFor="capsule-nickname">Nickname</Label>
              <Input
                id="capsule-nickname"
                value={pseudonym}
                maxLength={30}
                onChange={(e) => setPseudonym(e.target.value)}
                placeholder="midnight_coder"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Add to capsule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
