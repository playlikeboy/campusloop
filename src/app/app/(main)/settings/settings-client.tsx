"use client";

import {
  Check,
  Globe,
  RotateCcw,
  School,
  ShieldCheck,
  Sliders,
  Terminal,
  User,
  VenetianMask,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { NotificationPreferencesPanel } from "@/components/notifications/notification-preferences-panel";
import { PushNotificationToggle } from "@/components/notifications/push-notification-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { apiRequest } from "@/lib/api";
import { cn, getAvatarUrl } from "@/lib/utils";

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

export function SettingsClient({ profile }: SettingsClientProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [anonUsername, setAnonUsername] = useState(profile.anonymousUsername || "");
  const [feedVisibility, setFeedVisibility] = useState<"ALL" | "NON_ANONYMOUS">(
    (profile.feedVisibility as "ALL" | "NON_ANONYMOUS") || "ALL"
  );
  const [isSaving, setIsSaving] = useState(false);

  const currentAvatar = getAvatarUrl(avatarUrl, profile.username);

  function handleResetToDefaultAvatar() {
    const defaultSvg = getAvatarUrl(null, profile.username, profile.displayName);
    setAvatarUrl(defaultSvg);
    toast.success("Avatar reset to clean monogram initial DP!");
  }

  async function handleFeedVisibilityChange(mode: "ALL" | "NON_ANONYMOUS") {
    const previous = feedVisibility;
    setFeedVisibility(mode);
    try {
      await apiRequest("/api/profile/me", "PATCH", { feedVisibility: mode });
      if (typeof window !== "undefined") {
        localStorage.setItem("campusloop_feed_visibility", mode);
        window.dispatchEvent(new CustomEvent("campusloop_feed_visibility_change", { detail: mode }));
      }
      toast.success(mode === "NON_ANONYMOUS" ? "Anonymous posts hidden" : "All post types visible");
    } catch {
      setFeedVisibility(previous);
      toast.error("Could not save feed visibility.");
    }
  }
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const cleanAnon = anonUsername ? anonUsername.trim().toLowerCase().replace(/^@/, "") : null;
      await apiRequest("/api/profile/me", "PATCH", {
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl,
        anonymousUsername: cleanAnon,
      });
      toast.success("Profile updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-10 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/90 px-4 py-3 backdrop-blur-xl border-b border-border/60 flex items-center justify-between">
        <h1 className="text-base font-black tracking-tight flex items-center gap-2 text-foreground">
          <Sliders className="h-5 w-5 text-primary" /> Settings
        </h1>
      </header>

      <div className="px-3 py-4 sm:px-4 sm:py-5 space-y-4">
        {/* Profile Card Section */}
        <section className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Campus Identity
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Verified Student
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="relative group shrink-0">
              <Avatar className="h-16 w-16 border-2 border-primary/25">
                <AvatarImage src={currentAvatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-extrabold text-lg">
                  {displayName[0]}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div>
                <p className="text-sm font-black text-foreground">@{profile.username}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-start gap-1 mt-0.5">
                  <School className="h-3.5 w-3.5 text-primary" /> {profile.institutionName}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetToDefaultAvatar}
                className="inline-flex min-h-11 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-muted/50 hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5 text-primary" /> Reset avatar
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveSettings} className="space-y-3 pt-4 border-t border-border/60">
            <div className="space-y-1.5">
              <label htmlFor="settings-display-name" className="text-xs font-bold text-foreground">Display name</label>
              <input
                id="settings-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full min-h-11 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:bg-background transition-colors"
              />
            </div>

            {/* Custom Anonymous Username */}
            <div className="space-y-1.5 p-3 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <VenetianMask className="size-3.5 text-primary" /> Custom Anonymous Username
                </label>
                {anonUsername && (
                  <span className="text-[10px] text-primary font-bold">@{anonUsername.toLowerCase()}</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                All your anonymous confessions, polls, and questions will appear under this username instead
                of a random anon ID.
              </p>
              <div className="relative pt-1">
                <span className="absolute left-3.5 top-3.5 text-xs font-bold text-muted-foreground">
                  🎭 @
                </span>
                <input
                  type="text"
                  value={anonUsername}
                  onChange={(e) => setAnonUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="e.g. ghost_student, shadow_coder, campus_ninja"
                  maxLength={24}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-foreground outline-none focus:border-primary transition-all"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/80">
                Leave empty to use automatic randomized hash pseudonyms.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="settings-bio" className="text-xs font-bold text-foreground">Bio</label>
                <span className="text-[10px] tabular-nums text-muted-foreground">{bio.length}/160</span>
              </div>
              <textarea
                id="settings-bio"
                maxLength={160}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your interests, department, or goals..."
                rows={3}
                className="w-full min-h-28 rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground outline-none focus:border-primary focus:bg-background transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full min-h-11 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" /> Save Profile Changes
            </button>
          </form>
        </section>

        {/* Preferences Section */}
        <section className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" /> Platform Preferences
          </h2>

          <div className="space-y-3 pt-1">
            {/* Browser / PWA push opt-in */}
            <PushNotificationToggle />

            {/* Per-category notification switches */}
            <NotificationPreferencesPanel />

            {/* Feed Anonymity 2-Modes Toggler */}
            <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-3">
              <div>
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sliders className="size-3.5 text-primary" /> Feed Content & Anonymity Mode
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Toggle feed display mode. Choose whether anonymous posts and confessions appear in your
                  timeline.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Mode 1: All Posts Visible */}
                <button
                  type="button"
                  onClick={() => handleFeedVisibilityChange("ALL")}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-xs",
                    feedVisibility === "ALL"
                      ? "border-primary bg-primary/8 text-foreground"
                      : "border-border/60 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <Globe className="size-3.5 text-primary" /> 1. All Types of Posts
                    </span>
                    {feedVisibility === "ALL" && <Check className="size-3.5 text-primary stroke-3" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    All types of posts will be visible (Normal posts, Confessions, Polls, and Anonymous
                    thoughts).
                  </p>
                </button>

                {/* Mode 2: Only Non-Anonymous Posts Visible */}
                <button
                  type="button"
                  onClick={() => handleFeedVisibilityChange("NON_ANONYMOUS")}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-xs",
                    feedVisibility === "NON_ANONYMOUS"
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                      : "border-border/60 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-emerald-500" /> 2. Only Non-Anonymous
                    </span>
                    {feedVisibility === "NON_ANONYMOUS" && (
                      <Check className="size-3.5 text-primary stroke-3" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Only non-anonymous posts will be visible. Hides all anonymous confessions and pseudonymous
                    posts.
                  </p>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Verification & Rewards Status */}
        <section className="rounded-2xl border border-primary/20 bg-linear-to-r from-primary/10 via-card to-card p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Loop Points & Star Badge
            </h2>
            <span className="text-xs font-extrabold text-primary">{profile.points} LP</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Earn +20 LP for every classmate who joins CampusLoop using your referral link. Unlock blue-tick
            verified star badges at 150 LP!
          </p>

          <Link
            href="/app/profile"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-1"
          >
            View Verification Badges &amp; Invites →
          </Link>
        </section>

        {/* Developer & MCP API Keys */}
        <section className="rounded-2xl border border-primary/30 bg-card p-4 sm:p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" /> Model Context Protocol (MCP) &amp; API Keys
            </h2>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
              NEW
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Connect Cursor, Windsurf, Claude Desktop, and AI agents directly to your campus account with personal MCP server keys.
          </p>

          <Link
            href="/app/developer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-1"
          >
            Manage MCP Keys &amp; IDE Setup →
          </Link>
        </section>

        {/* Danger Zone */}
        <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 sm:p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-destructive flex items-center gap-2">
            <Lock className="h-4 w-4" /> Security & Account Session
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              Sign out of your active student session on this device.
            </p>

            <SignOutButton className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer border-none" />
          </div>
        </section>
      </div>
    </main>
  );
}
