"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { UserProfile } from "@/db/schema";
import type { CachedConversation } from "@/lib/chat-cache";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadImageToImgBB } from "@/lib/upload";
import { GroupDetailsStep, GroupMembersStep } from "./create-group-steps";
import { usePeopleSearch } from "./use-people-search";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onGroupCreated: (newConversationId: string, createdConv?: CachedConversation) => void;
}

/** Two-step "New group": details, then members. */
export function CreateGroupModal({ isOpen, onClose, currentUserId, onGroupCreated }: CreateGroupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("STUDY_POD");
  const [firstMessage, setFirstMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserProfile[]>([]);
  const [creating, setCreating] = useState(false);

  const people = usePeopleSearch(query, {
    enabled: isOpen && step === 2,
    allowEmpty: true,
    excludeId: currentUserId,
  });

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setTitle("");
    setCategory("STUDY_POD");
    setFirstMessage("");
    setAvatarUrl("");
    setSelected([]);
    setQuery("");
  }, [isOpen]);

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true);
    try {
      const uploaded = await uploadImageToImgBB(file);
      setAvatarUrl(uploaded.displayUrl || uploaded.url);
    } catch (err) {
      toast.error(
        err instanceof Error && err.message ? err.message : "Photo didn't upload. Try another one."
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  function toggle(user: UserProfile) {
    sounds.tap();
    haptics.light();
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  }

  async function create() {
    const name = title.trim();
    if (!name) {
      setStep(1);
      return;
    }
    if (selected.length === 0) {
      toast.error("Add at least one person to the group.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "GROUP",
          title: name,
          avatarUrl: avatarUrl || undefined,
          category,
          participantIds: selected.map((m) => m.id),
          content: firstMessage.trim() || `Welcome to ${name}!`,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Couldn't create the group. Try again.");
      }
      const data = (await res.json()) as CachedConversation;
      sounds.pop();
      haptics.success();
      toast.success("Group created");
      onClose();
      onGroupCreated(data.id, data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the group. Try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col">
        <DialogHeader>
          <DialogTitle>{step === 1 ? "New group" : "Add people"}</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Step 1 of 2"
              : `Step 2 of 2 · ${selected.length === 0 ? "nobody added yet" : `${selected.length} added`}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {step === 1 ? (
            <GroupDetailsStep
              title={title}
              onTitle={setTitle}
              category={category}
              onCategory={setCategory}
              firstMessage={firstMessage}
              onFirstMessage={setFirstMessage}
              avatarUrl={avatarUrl}
              uploadingAvatar={uploadingAvatar}
              onAvatarFile={(f) => void uploadAvatar(f)}
            />
          ) : (
            <GroupMembersStep
              query={query}
              onQuery={setQuery}
              results={people.results}
              loading={people.loading}
              failed={people.failed}
              selected={selected}
              onToggle={toggle}
            />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={!title.trim() || uploadingAvatar} onClick={() => setStep(2)}>
                Next: add people
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button disabled={selected.length === 0} loading={creating} onClick={() => void create()}>
                Create group
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
