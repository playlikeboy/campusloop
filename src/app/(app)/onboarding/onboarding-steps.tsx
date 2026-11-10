"use client";

import { Camera } from "lucide-react";
import type * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { fieldClassName, Input } from "@/components/ui/input";
import { labelClassName } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { DEGREE_CATEGORIES, getBranchOptionsForDegree } from "@/constants";
import { cn, initialOf } from "@/lib/utils";
import { CampusPicker } from "./onboarding-campus-picker";
import {
  GENDERS,
  type Gender,
  POPULAR_INTERESTS,
  PROSPECTIVE_FIELDS,
  PROSPECTIVE_STAGES,
} from "./onboarding-options";

export interface OnboardingValues {
  displayName: string;
  username: string;
  avatarUrl: string;
  /** Empty until the student picks one; the server requires a choice. */
  gender: Gender | "";
  dob: string;
  isDobPrivate: boolean;
  course: string;
  branch: string;
  year: number;
  bio: string;
  interests: string[];
  fieldOfInterest: string;
  prospectiveStage: string;
  dreamCampusIds: string[];
}

export interface StepProps {
  values: OnboardingValues;
  set: <K extends keyof OnboardingValues>(key: K, value: OnboardingValues[K]) => void;
  isViewer: boolean;
}

function ChoiceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-fg">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export function StepProfile({
  values,
  set,
  avatarSrc,
  nameError,
  usernameHint,
  usernameInvalid,
  uploading,
  onPickPhoto,
}: StepProps & {
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
        <Avatar className="size-20">
          <AvatarImage src={avatarSrc} className="object-cover" alt="" />
          <AvatarFallback className="bg-brand-subtle text-xl font-bold text-brand-text">
            {initialOf(values.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <Button type="button" variant="outline" loading={uploading} onClick={onPickPhoto}>
            {!uploading && <Camera aria-hidden="true" />}
            {values.avatarUrl ? "Change photo" : "Add a photo"}
          </Button>
          <p className="text-sm text-fg-muted">Optional. A clear face photo helps classmates find you.</p>
        </div>
      </div>

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
  );
}

export function StepBasics({ values, set, isViewer }: StepProps) {
  const branches = getBranchOptionsForDegree(values.course);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <ChoiceGroup label="Gender">
        {GENDERS.map((g) => (
          <Chip
            key={g.value}
            selected={values.gender === g.value}
            onSelectedChange={() => set("gender", g.value)}
          >
            {g.label}
          </Chip>
        ))}
      </ChoiceGroup>

      <div className="space-y-2">
        <FormField label="Birthday" hint="Optional">
          <Input type="date" value={values.dob} max={today} onChange={(e) => set("dob", e.target.value)} />
        </FormField>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-fg-muted">
          <Checkbox checked={values.isDobPrivate} onCheckedChange={(c) => set("isDobPrivate", Boolean(c))} />
          Hide my birthday from the campus birthday list
        </label>
      </div>

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
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="degree" className={labelClassName}>
                Degree
              </label>
              <select
                id="degree"
                value={values.course}
                onChange={(e) => {
                  const next = e.target.value;
                  set("course", next);
                  const nextBranches = getBranchOptionsForDegree(next);
                  if (!nextBranches.some((b) => b.name === values.branch) && nextBranches.length > 0) {
                    set("branch", nextBranches[0].name);
                  }
                }}
                className={cn(fieldClassName, "h-11")}
              >
                {DEGREE_CATEGORIES.map((cat) => (
                  <optgroup key={cat.category} label={cat.category}>
                    {cat.degrees.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} ({d.name})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="year" className={labelClassName}>
                Year
              </label>
              <select
                id="year"
                value={values.year}
                onChange={(e) => set("year", Number(e.target.value))}
                className={cn(fieldClassName, "h-11")}
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {branches.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="branch" className={labelClassName}>
                Branch
              </label>
              <SearchableSelect
                id="branch"
                options={branches.map((b) => ({ value: b.name, label: b.name, icon: b.icon }))}
                value={values.branch}
                onChange={(v) => set("branch", v)}
                placeholder="Pick your branch"
                searchPlaceholder="Search branches"
                emptyText="Not here? Pick 'Other / Not listed'."
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function StepExtras({ values, set, isViewer }: StepProps) {
  const toggleInterest = (tag: string) =>
    set(
      "interests",
      values.interests.includes(tag) ? values.interests.filter((t) => t !== tag) : [...values.interests, tag]
    );

  return (
    <div className="space-y-6">
      {isViewer && (
        <CampusPicker selectedIds={values.dreamCampusIds} onChange={(ids) => set("dreamCampusIds", ids)} />
      )}

      <ChoiceGroup label="What are you into?">
        {POPULAR_INTERESTS.map((tag) => (
          <Chip
            key={tag}
            selected={values.interests.includes(tag)}
            onSelectedChange={() => toggleInterest(tag)}
          >
            {tag}
          </Chip>
        ))}
      </ChoiceGroup>

      <FormField label="Bio" hint="Optional. One or two lines is plenty.">
        <Textarea
          rows={3}
          value={values.bio}
          onChange={(e) => set("bio", e.target.value)}
          placeholder={
            isViewer
              ? "Which colleges are you looking at, and why?"
              : "What do you study, build or care about?"
          }
        />
      </FormField>
    </div>
  );
}
