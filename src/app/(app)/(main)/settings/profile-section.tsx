"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAvatarUrl, initialOf } from "@/lib/utils";

interface ProfileSectionProps {
  profile: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    anonymousUsername?: string | null;
    institutionName: string | null;
  };
}

/** Quick edits for name, anonymous name and bio. Everything else lives on Edit profile. */
export function ProfileSection({ profile }: ProfileSectionProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [anon, setAnon] = useState(profile.anonymousUsername || "");
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    displayName !== (profile.displayName || "") ||
    bio !== (profile.bio || "") ||
    anon !== (profile.anonymousUsername || "");

  function discard() {
    setDisplayName(profile.displayName || "");
    setBio(profile.bio || "");
    setAnon(profile.anonymousUsername || "");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;
    if (!displayName.trim()) {
      toast.error("Add your name before saving.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
          anonymousUsername: anon ? anon.trim().toLowerCase().replace(/^@/, "") : null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Couldn't save. Try again.");
      }
      toast.success("Saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-labelledby="settings-profile" className="space-y-2">
      <h2 id="settings-profile" className="px-1 text-lg text-fg">
        Profile
      </h2>
      <form onSubmit={save} className="space-y-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-14">
            <AvatarImage src={getAvatarUrl(profile.avatarUrl, profile.username, displayName)} alt="" />
            <AvatarFallback className="bg-surface-muted font-semibold text-fg">
              {initialOf(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-fg">@{profile.username}</p>
            {profile.institutionName && (
              <p className="truncate text-sm text-fg-muted">{profile.institutionName}</p>
            )}
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/profile/edit">Edit profile</Link>
          </Button>
        </div>

        <FormField label="Name" required>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            required
          />
        </FormField>
        <FormField
          label="Anonymous name"
          hint={anon ? `Anonymous posts show as @${anon}.` : "Empty means a random name each time."}
        >
          <Input
            value={anon}
            onChange={(e) => setAnon(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            maxLength={24}
            autoCapitalize="none"
            placeholder="e.g. night_owl"
          />
        </FormField>
        <FormField label="Bio" hint={`${bio.length}/280`}>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 280))} rows={3} />
        </FormField>

        {isDirty && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={discard}>
              Discard
            </Button>
            <Button type="submit" loading={isSaving}>
              Save changes
            </Button>
          </div>
        )}
      </form>
    </section>
  );
}
