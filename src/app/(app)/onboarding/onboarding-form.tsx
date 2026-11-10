"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StoryProgress } from "@/components/ui/stickers";
import { isUsernameBlocking, UsernameStatusHint } from "@/components/ui/username-status";
import { useUsernameAvailability } from "@/hooks/use-username-availability";
import { uploadImageToImgBB } from "@/lib/upload";
import { getAvatarUrl } from "@/lib/utils";
import { validateDisplayName, validateUsername } from "@/lib/validation";
import { completeOnboarding } from "./actions";
import { PROSPECTIVE_FIELDS, PROSPECTIVE_STAGES } from "./onboarding-options";
import { type OnboardingValues, StepBasics, StepExtras, StepProfile } from "./onboarding-steps";

interface OnboardingFormProps {
  initialDisplayName?: string;
  initialUsername?: string;
  initialAvatarUrl?: string;
  /**
   * `student` is the verified college-email flow. `viewer` is Campus Preview:
   * an aspirant signing up with a personal email, who has no branch or year yet
   * and picks the campuses they are aiming for instead.
   */
  variant?: "student" | "viewer";
}

const STEP_TITLES = ["About you", "The basics", "Last bit"] as const;

export function OnboardingForm({
  initialDisplayName = "",
  initialUsername = "",
  initialAvatarUrl = "",
  variant = "student",
}: OnboardingFormProps) {
  const router = useRouter();
  const isViewer = variant === "viewer";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<OnboardingValues>({
    displayName: initialDisplayName,
    username: initialUsername,
    avatarUrl: initialAvatarUrl,
    gender: "",
    dob: "",
    isDobPrivate: false,
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    year: 1,
    bio: "",
    interests: [],
    fieldOfInterest: PROSPECTIVE_FIELDS[0],
    prospectiveStage: PROSPECTIVE_STAGES[0],
    dreamCampusIds: [],
  });

  const set = <K extends keyof OnboardingValues>(key: K, value: OnboardingValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const nameVal = values.displayName ? validateDisplayName(values.displayName) : null;
  const userVal = values.username ? validateUsername(values.username) : null;
  const usernameStatus = useUsernameAvailability(values.username);
  const profileReady =
    Boolean(nameVal?.isValid) &&
    Boolean(userVal?.isValid) &&
    !isUsernameBlocking(usernameStatus) &&
    !uploading;

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImageToImgBB(file);
      set("avatarUrl", res.displayUrl || res.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Photo didn't upload. Try a smaller JPG or PNG.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function submit() {
    setError(null);
    setSaving(true);
    const fd = new FormData();
    fd.set("displayName", values.displayName);
    fd.set("username", values.username);
    fd.set("gender", values.gender);
    fd.set("avatarUrl", values.avatarUrl);
    fd.set("bio", values.bio);
    fd.set("dob", values.dob);
    fd.set("isDobPrivate", String(values.isDobPrivate));
    fd.set("interests", JSON.stringify(values.interests));
    if (isViewer) {
      fd.set("course", "Prospective");
      fd.set("branch", values.fieldOfInterest);
      fd.set("aspirantStage", values.prospectiveStage);
      fd.set("targetInstitutionIds", JSON.stringify(values.dreamCampusIds));
    } else {
      fd.set("course", values.course);
      fd.set("branch", values.branch);
      fd.set("year", String(values.year));
    }

    try {
      const result = await completeOnboarding(fd);
      if (!result.success) {
        setError(result.error);
        if (result.step !== undefined) setStep(result.step);
        setSaving(false);
        return;
      }
      toast.success("You're in. Welcome to CampusLoop.");
      router.replace("/feeds");
      router.refresh();
    } catch {
      setError("Couldn't save your profile. Check your connection and try again.");
      setSaving(false);
    }
  }

  const last = step === STEP_TITLES.length - 1;
  const stepProps = { values, set, isViewer };

  return (
    <form
      className="pt-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 0 && !profileReady) return;
        if (step === 1 && !values.gender) {
          setError("Pick a gender to continue.");
          return;
        }
        setError(null);
        if (last) void submit();
        else setStep((s) => s + 1);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handlePhoto}
      />

      <StoryProgress
        count={STEP_TITLES.length}
        current={step}
        progress={1}
        aria-label={`Step ${step + 1} of ${STEP_TITLES.length}`}
      />
      <h2 className="mt-6 text-2xl text-fg">{STEP_TITLES[step]}</h2>

      <div className="mt-5">
        {step === 0 && (
          <StepProfile
            {...stepProps}
            avatarSrc={values.avatarUrl || getAvatarUrl(null, values.username, values.displayName)}
            nameError={nameVal && !nameVal.isValid ? nameVal.error : undefined}
            usernameHint={<UsernameStatusHint status={usernameStatus} />}
            usernameInvalid={usernameStatus.state === "taken" || usernameStatus.state === "invalid"}
            uploading={uploading}
            onPickPhoto={() => fileInputRef.current?.click()}
          />
        )}
        {step === 1 && <StepBasics {...stepProps} />}
        {step === 2 && <StepExtras {...stepProps} />}
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md bg-danger-subtle p-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-[var(--gutter)] mt-8 flex gap-3 border-t border-border bg-bg px-[var(--gutter)] pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Back"
            onClick={() => {
              setError(null);
              setStep((s) => s - 1);
            }}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          loading={saving}
          disabled={step === 0 && !profileReady}
        >
          {last ? (isViewer ? "Start looking around" : "Go to my campus") : "Next"}
        </Button>
      </div>
    </form>
  );
}
