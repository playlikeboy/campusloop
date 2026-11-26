"use client";

import { Camera } from "lucide-react";
import type * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { VerifiedSticker } from "@/components/ui/stickers";
import { CollegePicker, type PickedCollege } from "@/components/trust/college-picker";
import { initialOf } from "@/lib/utils";
import { CampusPicker } from "./onboarding-campus-picker";
import { PROSPECTIVE_FIELDS, PROSPECTIVE_STAGES } from "./onboarding-options";

export interface OnboardingValues {
  displayName: string;
  username: string;
  avatarUrl: string;
  /** Year of study, or null when the student skips it. */
  year: number | null;
  interests: string[];
  fieldOfInterest: string;
  prospectiveStage: string;
  dreamCampusIds: string[];
  /** The college an unverified member picks. Verified students get theirs from the email. */
  college: PickedCollege | null;
  /** Aspirant: not in college yet, joins Campus Preview instead of a campus. */
  notInCollegeYet: boolean;
}

export interface StepProps {
  values: OnboardingValues;
  set: <K extends keyof OnboardingValues>(key: K, value: OnboardingValues[K]) => void;
  /** Aspirant fields (stage, field, dream campuses) instead of year of study. */
  isViewer: boolean;
  /** Signed up without a verified college email: picks their college here. */
  isMember?: boolean;
}

export const YEARS = [1, 2, 3, 4, 5] as const;

function ChoiceGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-fg">
        {label}
        {hint && <span className="ml-1.5 font-normal text-fg-muted">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/**
 * Screen 1: who you are. Name, username and photo come from the sign-up
 * account and the college comes from the email, so most students only tap
 * their year and Continue.
 */
export function StepYou({
  values,
  set,
  isViewer,
  isMember = false,
  collegeName,
  avatarSrc,
  nameError,
  usernameHint,
  usernameInvalid,
  uploading,
  onPickPhoto,
}: StepProps & {
  collegeName: string | null;
  avatarSrc: string;
  nameError?: string;
  usernameHint: React.ReactNode;
  usernameInvalid: boolean;
  uploading: boolean;
  onPickPhoto: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onPickPhoto}
          className="relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          aria-label={values.avatarUrl ? "Change photo" : "Add a photo"}
        >
          <Avatar className="size-16">
            <AvatarImage src={avatarSrc} className="object-cover" alt="" />
            <AvatarFallback className="bg-brand-subtle text-xl font-bold text-brand-text">
              {initialOf(values.displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full bg-brand text-brand-fg shadow-sticker">
            <Camera className="size-3.5" aria-hidden="true" />
          </span>
        </button>
        <div className="min-w-0 space-y-1.5">
          {collegeName ? (
            <VerifiedSticker variant="flat" size="sm" label="Your college" college={collegeName} />
          ) : (
            <p className="text-sm font-semibold text-fg">{isViewer ? "Campus Preview" : "Member"}</p>
          )}
          <p className="text-sm text-fg-muted">
            {uploading
              ? "Uploading your photo…"
              : collegeName
                ? "We matched you from your college email."
                : isViewer
                  ? "Look around now, join your college later."
                  : "Verify your student status any time to get the verified badge."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Your name" required error={nameError}>
          <Input
            value={values.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder="Aarav Sharma"
            autoComplete="name"
            required
          />
        </FormField>

        <FormField label="Username" required hint={usernameHint}>
          <div className="relative">
            <span
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-base text-fg-subtle"
              aria-hidden="true"
            >
              @
            </span>
            <Input
              value={values.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="aarav_sharma"
              autoComplete="username"
              autoCapitalize="none"
              required
              aria-invalid={usernameInvalid || undefined}
              className="pl-8"
            />
          </div>
        </FormField>
      </div>

      {isMember && (
        <div className="space-y-3">
          {!values.notInCollegeYet && (
            <CollegePicker
              value={values.college}
              onChange={(college) => set("college", college)}
              hint="You'll join it as an unverified member. You can verify later."
            />
          )}
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-fg">
            <input
              type="checkbox"
              className="size-4 accent-brand"
              checked={values.notInCollegeYet}
              onChange={(e) => set("notInCollegeYet", e.target.checked)}
            />
            I'm not in college yet
          </label>
        </div>
      )}

      {isViewer ? (
        <>
          <ChoiceGroup label="Where are you right now?">
            {PROSPECTIVE_STAGES.map((stage) => (
              <Chip
                key={stage}
                selected={values.prospectiveStage === stage}
                onSelectedChange={() => set("prospectiveStage", stage)}
              >
                {stage}
              </Chip>
            ))}
          </ChoiceGroup>
          <ChoiceGroup label="What do you want to study?">
            {PROSPECTIVE_FIELDS.map((field) => (
              <Chip
                key={field}
                selected={values.fieldOfInterest === field}
                onSelectedChange={() => set("fieldOfInterest", field)}
              >
                {field}
              </Chip>
            ))}
          </ChoiceGroup>
          <CampusPicker selectedIds={values.dreamCampusIds} onChange={(ids) => set("dreamCampusIds", ids)} />
        </>
      ) : (
        <ChoiceGroup label="Which year are you in?" hint="Optional">
          {YEARS.map((y) => (
            <Chip
              key={y}
              selected={values.year === y}
              onSelectedChange={(on) => set("year", on ? y : null)}
              className="min-w-14 justify-center"
            >
              {y === 5 ? "5+" : `Year ${y}`}
            </Chip>
          ))}
        </ChoiceGroup>
      )}
    </div>
  );
}
