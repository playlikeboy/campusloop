"use client";

import { BookOpen, Camera, Check, Code2, Coffee, Home, Trophy, Users2 } from "lucide-react";
import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile } from "@/db/schema";
import { cn } from "@/lib/utils";
import { ChatPersonRow } from "./chat-person-row";

/** Stored as the conversation type by the API. */
export const GROUP_CATEGORIES = [
  { id: "STUDY_POD", label: "Study group", icon: BookOpen },
  { id: "PROJECT_TEAM", label: "Project team", icon: Code2 },
  { id: "CAMPUS_CLUB", label: "Club", icon: Trophy },
  { id: "HOSTEL_FLAT", label: "Hostel or flat", icon: Home },
  { id: "GENERAL_HANG", label: "Friends", icon: Coffee },
] as const;

interface DetailsStepProps {
  title: string;
  onTitle: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  firstMessage: string;
  onFirstMessage: (v: string) => void;
  avatarUrl: string;
  uploadingAvatar: boolean;
  onAvatarFile: (file: File) => void;
}

/** Step 1: photo, name, what the group is for, optional first message. */
export function GroupDetailsStep(p: DetailsStepProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="space-y-5">
      <div className="flex items-end gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label={p.avatarUrl ? "Change group photo" : "Add a group photo"}
          className="relative shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar className="size-16">
            <AvatarImage src={p.avatarUrl} alt="" />
            <AvatarFallback className="bg-brand-subtle text-brand-text">
              {p.title.trim() ? p.title.trim().slice(0, 2).toUpperCase() : <Users2 className="size-6" />}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border-2 border-surface-raised bg-brand text-brand-fg">
            {p.uploadingAvatar ? <Spinner size="xs" /> : <Camera className="size-3.5" />}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) p.onAvatarFile(file);
            e.target.value = "";
          }}
        />
        <FormField label="Group name" required className="flex-1">
          <Input
            autoFocus
            value={p.title}
            onChange={(e) => p.onTitle(e.target.value)}
            maxLength={40}
            placeholder="e.g. CSE 2nd year"
          />
        </FormField>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold text-fg">What's it for?</legend>
        <div className="flex flex-wrap gap-2">
          {GROUP_CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <Chip
                key={c.id}
                icon={<Icon />}
                selected={p.category === c.id}
                onClick={() => p.onCategory(c.id)}
              >
                {c.label}
              </Chip>
            );
          })}
        </div>
      </fieldset>

      <FormField label="First message" hint="Optional. Everyone sees it when the group opens.">
        <Textarea
          rows={2}
          maxLength={180}
          value={p.firstMessage}
          onChange={(e) => p.onFirstMessage(e.target.value)}
          placeholder="e.g. Notes and doubts for DBMS go here"
        />
      </FormField>
    </div>
  );
}

interface MembersStepProps {
  query: string;
  onQuery: (v: string) => void;
  results: UserProfile[];
  loading: boolean;
  failed: boolean;
  selected: UserProfile[];
  onToggle: (user: UserProfile) => void;
}

/** Step 2: search and pick members. Picked people show as removable chips. */
export function GroupMembersStep({
  query,
  onQuery,
  results,
  loading,
  failed,
  selected,
  onToggle,
}: MembersStepProps) {
  const isPicked = (id: string) => selected.some((m) => m.id === id);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Input
        autoFocus
        type="search"
        aria-label="Search people to add"
        placeholder="Search by name or @username"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        className="rounded-full"
      />

      {selected.length > 0 && (
        <ul aria-label="Added" className="no-scrollbar flex gap-2 overflow-x-auto">
          {selected.map((m) => (
            <li key={m.id}>
              <Chip size="sm" selected onClick={() => onToggle(m)} onRemove={() => onToggle(m)}>
                {m.displayName.split(" ")[0]}
              </Chip>
            </li>
          ))}
        </ul>
      )}

      <div className="-mx-2 min-h-48 flex-1 overflow-y-auto">
        {loading && results.length === 0 ? (
          <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-fg-muted">
            <Spinner size="sm" /> Searching…
          </div>
        ) : failed ? (
          <EmptyState
            size="compact"
            icon={Users2}
            title="Search didn't load"
            description="Check your connection and type again."
          />
        ) : results.length === 0 ? (
          <EmptyState
            size="compact"
            icon={Users2}
            title={query.trim() ? `No one found for "${query.trim()}"` : "Search for people to add"}
            description="Try a first name or @username."
          />
        ) : (
          <ul className="space-y-0.5">
            {results.map((user) => {
              const picked = isPicked(user.id);
              return (
                <li key={user.id}>
                  <ChatPersonRow
                    user={user}
                    toggle
                    selected={picked}
                    onClick={() => onToggle(user)}
                    trailing={
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                          picked ? "border-brand bg-brand text-brand-fg" : "border-border-strong"
                        )}
                      >
                        {picked && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
