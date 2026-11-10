"use client";

import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UsernameStatusHint } from "@/components/ui/username-status";
import { getBranchOptionsForDegree } from "@/constants";
import type { useUsernameAvailability } from "@/hooks/use-username-availability";
import type { EditProfileValues, Gender } from "./use-edit-profile-form";

const COURSES = ["B.Tech", "B.Arch", "BCA", "BBA", "B.Com", "MBBS", "M.Tech", "MCA", "MBA", "PhD"];
const INTERESTS = [
  "Tech & Coding",
  "Late Night Tea",
  "Hostel Life",
  "Exam Prep",
  "Music & Jamming",
  "Campus Dating",
  "Gaming",
  "Sports",
  "Photography",
  "Startups & AI",
];

interface AboutSectionProps {
  values: EditProfileValues;
  set: <K extends keyof EditProfileValues>(key: K, value: EditProfileValues[K]) => void;
  nameError?: string;
  usernameStatus: ReturnType<typeof useUsernameAvailability>;
}

export function AboutSection({ values, set, nameError, usernameStatus }: AboutSectionProps) {
  const branchOptions = getBranchOptionsForDegree(values.course).map((b) => ({
    value: b.name,
    label: b.name,
    icon: b.icon,
  }));

  return (
    <>
      <section className="space-y-4" aria-labelledby="about-title">
        <h2 id="about-title" className="text-lg text-fg">
          About you
        </h2>
        <FormField label="Name" required error={nameError}>
          <Input
            value={values.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder="e.g. Aarav Sharma"
            autoComplete="name"
            required
          />
        </FormField>
        <FormField label="Username" required>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-muted">
              @
            </span>
            <Input
              value={values.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="username"
              autoCapitalize="none"
              autoComplete="username"
              className="pl-7"
              required
            />
          </div>
          <UsernameStatusHint status={usernameStatus} />
        </FormField>
        <FormField
          label="Headline"
          hint={`${values.headline.length}/100. One line, e.g. "CSE, 2nd year. Into web dev."`}
        >
          <Input value={values.headline} maxLength={100} onChange={(e) => set("headline", e.target.value)} />
        </FormField>
        <FormField label="Bio" hint={`${values.bio.length}/300`}>
          <Textarea
            rows={3}
            maxLength={300}
            value={values.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="What you study, what you're into, what you're looking for."
          />
        </FormField>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-fg">Gender</p>
          <SegmentedControl<Gender>
            aria-label="Gender"
            fullWidth
            value={values.gender}
            onChange={(g) => set("gender", g)}
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
              { value: "OTHER", label: "Other" },
            ]}
          />
        </div>
        <FormField label="Birthday" hint="Used for birthday wishes on campus.">
          <Input
            type="date"
            value={values.dob}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => set("dob", e.target.value)}
          />
        </FormField>
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm text-fg">
          Hide my birthday
          <Switch checked={values.isDobPrivate} onCheckedChange={(v) => set("isDobPrivate", Boolean(v))} />
        </label>
      </section>

      <section className="space-y-4 border-t border-border pt-6" aria-labelledby="study-title">
        <h2 id="study-title" className="text-lg text-fg">
          What you study
        </h2>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-fg">Course</p>
          <div className="flex flex-wrap gap-2">
            {COURSES.map((c) => (
              <Chip
                key={c}
                size="sm"
                selected={values.course === c}
                onSelectedChange={() => set("course", c)}
              >
                {c}
              </Chip>
            ))}
          </div>
          <Input
            value={values.course}
            onChange={(e) => set("course", e.target.value)}
            placeholder="Not listed? Type it here"
            aria-label="Course"
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-fg">Branch</p>
          <SearchableSelect
            options={branchOptions}
            value={values.branch}
            onChange={(b) => set("branch", b)}
            placeholder="Pick your branch"
            searchPlaceholder="Search branches"
            emptyText="Not found. Type it below."
          />
          <Input
            value={values.branch}
            onChange={(e) => set("branch", e.target.value)}
            placeholder="Or type your branch"
            aria-label="Branch"
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-fg">Year</p>
          <SegmentedControl
            aria-label="Year"
            fullWidth
            value={String(values.year)}
            onChange={(y) => set("year", Number(y))}
            options={["1", "2", "3", "4", "5"].map((y) => ({ value: y, label: y }))}
          />
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-6" aria-labelledby="interests-title">
        <h2 id="interests-title" className="text-lg text-fg">
          Interests
        </h2>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((tag) => {
            const on = values.interests.includes(tag);
            return (
              <Chip
                key={tag}
                size="sm"
                selected={on}
                onSelectedChange={() =>
                  set(
                    "interests",
                    on ? values.interests.filter((t) => t !== tag) : [...values.interests, tag]
                  )
                }
              >
                {tag}
              </Chip>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-6" aria-labelledby="anon-title">
        <h2 id="anon-title" className="text-lg text-fg">
          Anonymous name
        </h2>
        <FormField
          label="Name for anonymous posts"
          hint={
            values.anonUsername
              ? `Your anonymous posts show as @${values.anonUsername}.`
              : "Leave empty to get a random name each time."
          }
        >
          <Input
            value={values.anonUsername}
            maxLength={24}
            autoCapitalize="none"
            onChange={(e) => set("anonUsername", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="e.g. night_owl"
          />
        </FormField>
      </section>
    </>
  );
}
