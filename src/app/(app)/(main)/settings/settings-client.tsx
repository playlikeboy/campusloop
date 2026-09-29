"use client";

import {
  Bell,
  ChevronRight,
  Check,
  Globe2,
  LockKeyhole,
  RotateCcw,
  School,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  VenetianMask,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentType, type FormEvent } from "react";
import { toast } from "sonner";

import { NotificationPreferencesPanel } from "@/components/notifications/notification-preferences-panel";
import { PushNotificationToggle } from "@/components/notifications/push-notification-toggle";
import {
  AnimatedIcon,
  AnimatedLock,
  AnimatedSettings,
  AnimatedShieldCheck,
  AnimatedUser,
} from "@/components/ui/animated-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { cn, getAvatarUrl } from "@/lib/utils";

type IconComponent = ComponentType<{ className?: string }>;

interface SettingsClientProps {
  profile: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    course: string | null;
    branch: string | null;
    year: number | null;
    role: string;
    points: number;
    institutionName: string;
    anonymousUsername?: string | null;
    feedVisibility?: string;
  };
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: IconComponent;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 pt-0.5">
        <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: IconComponent;
  title: string;
  description: string;
  href?: string;
}) {
  const content = (
    <div className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-background/35 px-3.5 py-3 transition-all hover:border-primary/25 hover:bg-background/70">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      {href ? <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" /> : null}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  value,
  disabled = false,
  onChange,
}: {
  icon: IconComponent;
  title: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={title}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all",
        disabled
          ? "cursor-not-allowed border-border/40 bg-muted/10 opacity-50"
          : "cursor-pointer border-border/70 bg-background/35 hover:border-primary/20 hover:bg-background/70 active:scale-[0.995]",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
          value ? "bg-primary/10 text-primary" : "bg-muted/70 text-muted-foreground",
        )}
      >
        <Icon className="size-4.5" />
      </div>

      <div className="min-w-0 flex-1 pr-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>

      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors",
          value ? "bg-primary" : "bg-muted-foreground/30",
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "size-5 rounded-full bg-white shadow-sm transition-transform",
            value ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [anonUsername, setAnonUsername] = useState(profile.anonymousUsername || "");
  const [feedVisibility, setFeedVisibility] = useState<"ALL" | "NON_ANONYMOUS">(
    (profile.feedVisibility as "ALL" | "NON_ANONYMOUS") || "ALL",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [defaultScope, setDefaultScope] = useState<"GLOBAL" | "CAMPUS">("GLOBAL");
  const [notifyUpvotes, setNotifyUpvotes] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);

  const currentAvatar = getAvatarUrl(avatarUrl, profile.username);
  const rewardProgress = Math.min(profile.points / 150, 1);

  function handleResetToDefaultAvatar() {
    const defaultSvg = getAvatarUrl(null, profile.username, profile.displayName);
    setAvatarUrl(defaultSvg);
    toast.success("Avatar reset to your monogram.");
  }

  async function handleFeedVisibilityChange(mode: "ALL" | "NON_ANONYMOUS") {
    const previous = feedVisibility;
    setFeedVisibility(mode);

    if (typeof window !== "undefined") {
      localStorage.setItem("campusloop_feed_visibility", mode);
      window.dispatchEvent(new CustomEvent("campusloop_feed_visibility_change", { detail: mode }));
    }

    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedVisibility: mode }),
      });

      if (!res.ok) {
        throw new Error("Could not save feed mode preference.");
      }

      toast.success(
        mode === "NON_ANONYMOUS"
          ? "Anonymous posts hidden from your feed."
          : "All post types are visible again.",
      );
    } catch {
      setFeedVisibility(previous);

      if (typeof window !== "undefined") {
        localStorage.setItem("campusloop_feed_visibility", previous);
      }

      toast.error("Could not save feed mode preference.");
    }
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);

    try {
      const cleanAnon = anonUsername
        ? anonUsername.trim().toLowerCase().replace(/^@/, "")
        : null;

      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          avatarUrl,
          anonymousUsername: cleanAnon,
          feedVisibility,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to save settings");
      }

      toast.success("Profile settings saved.");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl pb-28 text-foreground">
      <div className="px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <AnimatedIcon icon={AnimatedSettings} animation="spin" size={21} duration={0.8} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Settings &amp; Account</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep your profile, privacy, and CampusLoop experience under control.
              </p>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-linear-to-br from-primary/10 via-card to-card p-4 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-12 size-40 rounded-full bg-violet-500/5 blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AnimatedIcon icon={AnimatedUser} animation="pop" size={19} className="text-primary" />
                <h2 className="text-base font-bold">Campus Identity</h2>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
                <AnimatedIcon icon={AnimatedShieldCheck} animation="pop" size={14} />
                Verified student
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)] lg:items-center">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="shrink-0 rounded-[24px] bg-linear-to-br from-primary/30 via-primary/8 to-transparent p-1">
                  <Avatar className="size-24 border-4 border-background/80 shadow-xl sm:size-28">
                    <AvatarImage src={currentAvatar} alt={displayName} />
                    <AvatarFallback className="bg-primary/10 text-2xl font-black text-primary">
                      {displayName?.charAt(0)?.toUpperCase() || "C"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="min-w-0">
                  <p className="text-xl font-black tracking-tight sm:text-2xl">@{profile.username}</p>
                  <p className="mt-1 flex items-start gap-1.5 text-sm leading-5 text-muted-foreground">
                    <School className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="min-w-0">{profile.institutionName}</span>
                  </p>

                  <button
                    type="button"
                    onClick={handleResetToDefaultAvatar}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/25 hover:bg-background/75 active:scale-[0.98]"
                  >
                    <RotateCcw className="size-3.5 text-primary" />
                    Reset monogram
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="rounded-2xl border border-border/60 bg-background/35 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Campus</p>
                  <p className="mt-1 line-clamp-2 text-sm font-bold">{profile.institutionName}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/35 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Loop points</p>
                  <p className="mt-1 text-lg font-black text-primary">{profile.points} LP</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSaveSettings} className="mt-4 overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm">
          <div className="border-b border-border/60 px-4 py-5 sm:px-6">
            <SectionHeader
              icon={SlidersHorizontal}
              title="Profile details"
              description="Update the identity other students see across CampusLoop."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground">Display name</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="h-12 w-full rounded-2xl border border-border/70 bg-background/50 px-4 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:bg-background"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground">Campus username</span>
                <div className="flex h-12 items-center rounded-2xl border border-border/70 bg-background/35 px-4 text-sm font-semibold text-muted-foreground">
                  <span className="text-primary">@</span>
                  <span className="ml-1 truncate text-foreground">{profile.username}</span>
                  <span className="ml-auto rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                    Locked
                  </span>
                </div>
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Anonymous username</span>
                  <span className="font-mono text-[11px] text-primary">
                    {anonUsername ? `@${anonUsername}` : "automatic"}
                  </span>
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-bold text-muted-foreground">
                    🎭@
                  </span>
                  <input
                    type="text"
                    value={anonUsername}
                    onChange={(e) =>
                      setAnonUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    placeholder="campus_ninja"
                    maxLength={24}
                    className="h-12 w-full rounded-2xl border border-border/70 bg-background/50 pl-14 pr-4 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-background"
                  />
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Anonymous confessions, polls, and questions use this alias instead of a random pseudonym.
                </p>
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Bio / campus vibe</span>
                  <span>{bio.length}/280</span>
                </span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 280))}
                  placeholder="Interests, branch, goals, or what you're building..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-border/70 bg-background/50 p-4 text-sm font-medium leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-background"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-muted-foreground">Changes apply across your CampusLoop profile.</p>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="size-4" />
              {isSaving ? "Saving..." : "Save profile changes"}
            </button>
          </div>
        </form>

        <section className="mt-4 rounded-[28px] border border-border/70 bg-card p-4 shadow-sm sm:p-6">
          <SectionHeader
            icon={Bell}
            title="Notifications"
            description="Choose how CampusLoop reaches you and which activity deserves your attention."
          />
          <div className="space-y-3">
            <PushNotificationToggle />
            <NotificationPreferencesPanel />

            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleRow
                icon={Bell}
                title="Upvote alerts"
                description="Know when students react to your posts."
                value={notifyUpvotes}
                onChange={setNotifyUpvotes}
              />
              <ToggleRow
                icon={Bell}
                title="Comment & DM alerts"
                description="Get notified about replies and messages."
                value={notifyComments}
                onChange={setNotifyComments}
              />
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-border/70 bg-card p-4 shadow-sm sm:p-6">
          <SectionHeader
            icon={Globe2}
            title="Feed & privacy"
            description="Shape what appears in your feed without affecting the rest of your account."
          />

          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-background/35 p-3.5">
              <div className="mb-3">
                <p className="text-sm font-semibold">Feed visibility</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Pick whether anonymous content is included in your timeline.
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {[
                  {
                    mode: "ALL" as const,
                    title: "All post types",
                    description: "Normal posts, confessions, polls, and anonymous thoughts.",
                    icon: Globe2,
                  },
                  {
                    mode: "NON_ANONYMOUS" as const,
                    title: "Only non-anonymous",
                    description: "Hide anonymous and pseudonymous content from your feed.",
                    icon: ShieldCheck,
                  },
                ].map((option) => {
                  const selected = feedVisibility === option.mode;
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.mode}
                      type="button"
                      onClick={() => handleFeedVisibilityChange(option.mode)}
                      className={cn(
                        "rounded-2xl border p-3.5 text-left transition-all active:scale-[0.995]",
                        selected
                          ? "border-primary/50 bg-primary/10 shadow-[0_0_0_1px_rgba(244,81,42,0.18)]"
                          : "border-border/60 bg-background/30 hover:border-border hover:bg-background/60",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-xl",
                            selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        {selected ? <Check className="size-4 text-primary" /> : null}
                      </div>
                      <p className="mt-3 text-sm font-bold">{option.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/35 p-3.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Default feed scope</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Choose the view you want first when you open CampusLoop.
                  </p>
                </div>

                <div className="grid grid-cols-2 rounded-2xl border border-border/60 bg-muted/70 p-1">
                  {[
                    { value: "GLOBAL" as const, label: "Global" },
                    { value: "CAMPUS" as const, label: "My college" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDefaultScope(option.value)}
                      className={cn(
                        "min-w-24 rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        defaultScope === option.value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-border/70 bg-card p-4 shadow-sm sm:p-6">
          <SectionHeader
            icon={Zap}
            title="Loop rewards & developer access"
            description="Your account extras, referral progress, and AI tooling live here."
          />

          <div className="space-y-3">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">Loop Points</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Unlock verified star badges at 150 LP.
                  </p>
                </div>
                <p className="text-lg font-black text-primary">{profile.points} LP</p>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${rewardProgress * 100}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>0 LP</span>
                <span>150 LP milestone</span>
              </div>
            </div>

            <SettingRow
              icon={Terminal}
              title="MCP & API keys"
              description="Connect Cursor, Windsurf, Claude Desktop, and other AI agents."
              href="/developer"
            />

            <SettingRow
              icon={School}
              title="Verification & invites"
              description="View badges and referral progress on your profile."
              href="/profile"
            />
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-[28px] border border-destructive/25 bg-destructive/5 shadow-sm">
          <div className="border-b border-destructive/15 px-4 py-5 sm:px-6">
            <SectionHeader
              icon={LockKeyhole}
              title="Security"
              description="Sign out of this device when you're finished."
            />
          </div>

          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AnimatedIcon icon={AnimatedLock} animation="pop" size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">Active student session</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  This only signs you out on the current device.
                </p>
              </div>
            </div>

            <SignOutButton className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl border border-destructive/25 bg-destructive px-5 text-sm font-bold text-destructive-foreground shadow-sm transition-all hover:bg-destructive/90 active:scale-[0.985]" />
          </div>
        </section>

        <p className="pt-2 text-center text-xs text-muted-foreground/70">
          CampusLoop settings · Built for campus life
        </p>
      </div>
    </main>
  );
}