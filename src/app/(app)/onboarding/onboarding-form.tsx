"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StoryProgress } from "@/components/ui/stickers";
import { isUsernameBlocking, UsernameStatusHint } from "@/components/ui/username-status";
import { useUsernameAvailability } from "@/hooks/use-username-availability";
import { trackOnboardingComplete, trackOnboardingStep } from "@/lib/analytics/ga4";
import type { TastePost } from "@/lib/growth/taste-quiz";
import { uploadImageToImgBB } from "@/lib/upload";
import { getAvatarUrl } from "@/lib/utils";
import { validateDisplayName, validateUsername } from "@/lib/validation";
import { completeOnboarding, followSuggested, saveTasteQuiz } from "./actions";
import { PROSPECTIVE_FIELDS, PROSPECTIVE_STAGES } from "./onboarding-options";
import { type OnboardingValues, StepYou } from "./onboarding-steps";
import { StepFirstPost } from "./step-first-post";
import { StepFollow } from "./step-follow";
import { StepTaste, type TasteResult } from "./step-taste";

interface OnboardingFormProps {
  initialDisplayName?: string;
  initialUsername?: string;
  initialAvatarUrl?: string;
  /** The college matched from the email domain, or null in Campus Preview. */
  collegeName?: string | null;
  /** Real top posts for the taste swipe. */
  quizPosts?: TastePost[];
  /**
   * `student` is the verified college-email flow. `viewer` is Campus Preview:
   * an aspirant signing up with a personal email, who cannot post or follow
   * yet, so their flow ends after the taste swipe.
   */
  variant?: "student" | "viewer";
}

type Screen = "you" | "taste" | "follow" | "post";

const TITLES: Record<Screen, string> = {
  you: "This is you",
  taste: "What do you want to see?",
  follow: "Follow your campus",
  post: "Your first post",
};

/**
 * Onboarding in three quick screens plus a first-post moment:
 * who you are, a taste swipe on real posts, follow your campus, then post.
 * The profile is saved after the first screen, so leaving early still works.
 */
export function OnboardingForm({
  initialDisplayName = "",
  initialUsername = "",
  initialAvatarUrl = "",
  collegeName = null,
  quizPosts = [],
  variant = "student",
}: OnboardingFormProps) {
  const router = useRouter();
  const isViewer = variant === "viewer";
  const screens: Screen[] = isViewer ? ["you", "taste"] : ["you", "taste", "follow", "post"];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [screen, setScreen] = useState<Screen>("you");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<OnboardingValues>({
    displayName: initialDisplayName,
    username: initialUsername,
    avatarUrl: initialAvatarUrl,
    year: null,
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

  function finish(posted: boolean) {
    trackOnboardingComplete();
    toast.success(posted ? "Posted. Welcome to CampusLoop." : "You're in. Welcome to CampusLoop.");
    router.replace("/feeds");
    router.refresh();
  }

  async function saveProfile() {
    setError(null);
    setSaving(true);
    const fd = new FormData();
    fd.set("displayName", values.displayName);
    fd.set("username", values.username);
    fd.set("avatarUrl", values.avatarUrl);
    if (isViewer) {
      fd.set("course", "Prospective");
      fd.set("branch", values.fieldOfInterest);
      fd.set("aspirantStage", values.prospectiveStage);
      fd.set("targetInstitutionIds", JSON.stringify(values.dreamCampusIds));
    } else if (values.year) {
      fd.set("year", String(values.year));
    }

    try {
      const result = await completeOnboarding(fd);
      if (!result.success) {
        setError(result.error);
        setSaving(false);
        return;
      }
      trackOnboardingStep("you");
      setSaving(false);
      setScreen("taste");
    } catch {
      setError("Couldn't save your profile. Check your connection and try again.");
      setSaving(false);
    }
  }

  async function saveTaste(result: TasteResult) {
    setSaving(true);
    // The swipe only tunes the feed; a failure here must not block the student.
    await saveTasteQuiz(result).catch(() => null);
    trackOnboardingStep("taste", { liked: result.likedPostIds.length, skipped: result.skippedPostIds.length });
    setSaving(false);
    if (isViewer) finish(false);
    else setScreen("follow");
  }

  async function saveFollows(ids: string[]) {
    setSaving(true);
    const { followed } = await followSuggested(ids).catch(() => ({ followed: 0 }));
    trackOnboardingStep("follow", { followed });
    setSaving(false);
    setScreen("post");
  }

  const index = screens.indexOf(screen);

  return (
    <div className="pt-6 pb-10">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handlePhoto}
      />

      <StoryProgress
        count={screens.length}
        current={index}
        progress={1}
        aria-label={`Step ${index + 1} of ${screens.length}`}
      />
      <h1 className="mt-6 text-3xl text-fg">{TITLES[screen]}</h1>

      <div className="mt-5">
        {screen === "you" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (profileReady && !saving) void saveProfile();
            }}
          >
            <StepYou
              values={values}
              set={set}
              isViewer={isViewer}
              collegeName={collegeName}
              avatarSrc={values.avatarUrl || getAvatarUrl(null, values.username, values.displayName)}
              nameError={nameVal && !nameVal.isValid ? nameVal.error : undefined}
              usernameHint={<UsernameStatusHint status={usernameStatus} />}
              usernameInvalid={usernameStatus.state === "taken" || usernameStatus.state === "invalid"}
              uploading={uploading}
              onPickPhoto={() => fileInputRef.current?.click()}
            />
            {error && (
              <p role="alert" className="mt-6 rounded-md bg-danger-subtle p-3 text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <div className="sticky bottom-0 -mx-[var(--gutter)] mt-8 border-t border-border bg-bg px-[var(--gutter)] pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button type="submit" size="lg" className="w-full" loading={saving} disabled={!profileReady}>
                Continue
              </Button>
            </div>
          </form>
        )}

        {screen === "taste" && <StepTaste posts={quizPosts} saving={saving} onDone={saveTaste} />}

        {screen === "follow" && <StepFollow saving={saving} onDone={saveFollows} />}

        {screen === "post" && (
          <StepFirstPost
            collegeName={collegeName ? collegeName.split(",")[0].trim() : null}
            onDone={(posted) => {
              trackOnboardingStep("first_post", { posted });
              finish(posted);
            }}
          />
        )}
      </div>
    </div>
  );
}
