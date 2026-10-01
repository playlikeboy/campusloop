"use client";

import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Database,
  Eye,
  Globe2,
  HardDrive,
  Laptop,
  Lock,
  MessageSquare,
  Moon,
  Radio,
  RotateCcw,
  Save,
  School,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  User,
  Vibrate,
  Volume2,
  VolumeX,
  Wifi,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { NotificationPreferencesPanel } from "@/components/notifications/notification-preferences-panel";
import { PushNotificationToggle } from "@/components/notifications/push-notification-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
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
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Profile Form State
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [anonUsername, setAnonUsername] = useState(profile.anonymousUsername || "");
  const [feedVisibility, setFeedVisibility] = useState<"ALL" | "NON_ANONYMOUS">(
    (profile.feedVisibility as "ALL" | "NON_ANONYMOUS") || "ALL"
  );
  const [defaultScope, setDefaultScope] = useState<"CAMPUS" | "GLOBAL">("GLOBAL");
  const [isSaving, setIsSaving] = useState(false);

  // Audio & Haptics state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Data saver & media state
  const [dataSaver, setDataSaver] = useState(false);
  const [autoplayMode, setAutoplayMode] = useState<"always" | "wifi" | "never">("wifi");
  const [reducedMotion, setReducedMotion] = useState(false);

  // Social & messaging privacy state
  const [dmScope, setDmScope] = useState<"ALL" | "VERIFIED" | "MUTUAL">("ALL");
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  // Storage / cache state & device session
  const [cacheSize, setCacheSize] = useState<string>("Calculating...");
  const [deviceInfo, setDeviceInfo] = useState({
    browser: "Web Client",
    os: "Operating System",
    isMobile: false,
  });

  // Load preferences & device specs from localStorage / client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScope = localStorage.getItem("campusloop_default_scope");
      if (savedScope === "CAMPUS" || savedScope === "GLOBAL") {
        setDefaultScope(savedScope);
      }

      setSoundEnabled(sounds.isEnabled());
      setHapticsEnabled(haptics.isEnabled());

      const savedDataSaver = localStorage.getItem("campusloop_data_saver");
      if (savedDataSaver !== null) setDataSaver(savedDataSaver === "true");

      const savedAutoplay = localStorage.getItem("campusloop_autoplay");
      if (savedAutoplay === "always" || savedAutoplay === "wifi" || savedAutoplay === "never") {
        setAutoplayMode(savedAutoplay);
      }

      const savedReducedMotion = localStorage.getItem("campusloop_reduced_motion");
      if (savedReducedMotion !== null) setReducedMotion(savedReducedMotion === "true");

      const savedDmScope = localStorage.getItem("campusloop_dm_scope");
      if (savedDmScope === "ALL" || savedDmScope === "VERIFIED" || savedDmScope === "MUTUAL") {
        setDmScope(savedDmScope);
      }

      const savedOnline = localStorage.getItem("campusloop_show_online");
      if (savedOnline !== null) setOnlineStatus(savedOnline !== "false");

      const savedReadReceipts = localStorage.getItem("campusloop_read_receipts");
      if (savedReadReceipts !== null) setReadReceipts(savedReadReceipts !== "false");

      // Device detection
      const ua = navigator.userAgent;
      let browser = "Web Client";
      if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
      else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
      else if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Edg")) browser = "Edge";

      let os = "Desktop";
      if (ua.includes("Android")) os = "Android";
      else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
      else if (ua.includes("Mac")) os = "macOS";
      else if (ua.includes("Windows")) os = "Windows";
      else if (ua.includes("Linux")) os = "Linux";

      const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
      setDeviceInfo({ browser, os, isMobile });

      // Approximate storage usage
      try {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            total += (localStorage.getItem(key)?.length || 0) * 2;
          }
        }
        if (total < 1024) setCacheSize(`${total} B`);
        else if (total < 1024 * 1024) setCacheSize(`${(total / 1024).toFixed(1)} KB`);
        else setCacheSize(`${(total / (1024 * 1024)).toFixed(2)} MB`);
      } catch {
        setCacheSize("1.2 MB");
      }
    }
  }, []);

  // Track if changes are dirty
  const isDirty =
    displayName !== (profile.displayName || "") ||
    bio !== (profile.bio || "") ||
    avatarUrl !== profile.avatarUrl ||
    anonUsername !== (profile.anonymousUsername || "");

  const currentAvatar = getAvatarUrl(avatarUrl, profile.username, displayName);
  const rewardProgress = Math.min(profile.points / 150, 1);

  function handleResetToMonogram() {
    sounds.tap();
    haptics.light();
    const defaultSvg = getAvatarUrl(null, profile.username, displayName);
    setAvatarUrl(defaultSvg);
    toast.success("Avatar reset to clean monogram.");
  }

  function handleDiscardChanges() {
    sounds.tap();
    haptics.light();
    setDisplayName(profile.displayName || "");
    setBio(profile.bio || "");
    setAvatarUrl(profile.avatarUrl);
    setAnonUsername(profile.anonymousUsername || "");
  }

  function handleScopeChange(nextScope: "CAMPUS" | "GLOBAL") {
    sounds.tap();
    haptics.light();
    setDefaultScope(nextScope);
    if (typeof window !== "undefined") {
      localStorage.setItem("campusloop_default_scope", nextScope);
    }
    toast.success(
      nextScope === "CAMPUS"
        ? "Default feed set to your college."
        : "Default feed set to All India."
    );
  }

  async function handleFeedVisibilityChange(mode: "ALL" | "NON_ANONYMOUS") {
    const previous = feedVisibility;
    sounds.tap();
    haptics.medium();
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

      if (!res.ok) throw new Error("Could not update feed mode.");

      toast.success(
        mode === "NON_ANONYMOUS"
          ? "Anonymous posts hidden from feed."
          : "All campus posts visible."
      );
    } catch {
      setFeedVisibility(previous);
      if (typeof window !== "undefined") {
        localStorage.setItem("campusloop_feed_visibility", previous);
      }
      toast.error("Could not save feed mode preference.");
    }
  }

  function handleToggleSound(nextVal: boolean) {
    setSoundEnabled(nextVal);
    sounds.setEnabled(nextVal);
    if (nextVal) {
      sounds.ting();
    }
    toast.success(nextVal ? "In-app audio effects enabled." : "In-app audio effects muted.");
  }

  function handleToggleHaptics(nextVal: boolean) {
    setHapticsEnabled(nextVal);
    haptics.setEnabled(nextVal);
    if (nextVal) {
      haptics.medium();
    }
    toast.success(nextVal ? "Haptic feedback enabled." : "Haptic feedback disabled.");
  }

  function handleToggleDataSaver(nextVal: boolean) {
    sounds.tap();
    haptics.light();
    setDataSaver(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("campusloop_data_saver", nextVal ? "true" : "false");
    }
    toast.success(nextVal ? "Data Saver activated (low bandwidth mode)." : "Data Saver deactivated.");
  }

  function handleAutoplayChange(mode: "always" | "wifi" | "never") {
    sounds.tap();
    haptics.light();
    setAutoplayMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("campusloop_autoplay", mode);
    }
    toast.success(
      `Video autoplay set to ${mode === "wifi" ? "Wi-Fi Only" : mode === "always" ? "Always" : "Never"}.`
    );
  }

  function handleToggleReducedMotion(nextVal: boolean) {
    sounds.tap();
    haptics.light();
    setReducedMotion(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("campusloop_reduced_motion", nextVal ? "true" : "false");
    }
    toast.success(nextVal ? "Reduced motion activated." : "Full fluid animations restored.");
  }

  function handleDmScopeChange(mode: "ALL" | "VERIFIED" | "MUTUAL") {
    sounds.tap();
    haptics.light();
    setDmScope(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("campusloop_dm_scope", mode);
    }
    toast.success(
      mode === "ALL"
        ? "Direct messages allowed from all campus students."
        : mode === "VERIFIED"
          ? "Direct messages restricted to verified students."
          : "Direct messages restricted to mutual follows only."
    );
  }

  function handleToggleOnlineStatus(nextVal: boolean) {
    sounds.tap();
    haptics.light();
    setOnlineStatus(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("campusloop_show_online", nextVal ? "true" : "false");
    }
    toast.success(nextVal ? "Active status visible to classmates." : "Ghost mode active (status hidden).");
  }

  function handleToggleReadReceipts(nextVal: boolean) {
    sounds.tap();
    haptics.light();
    setReadReceipts(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("campusloop_read_receipts", nextVal ? "true" : "false");
    }
    toast.success(nextVal ? "Read receipts enabled." : "Read receipts disabled.");
  }

  function handleClearCache() {
    sounds.tap();
    haptics.heavy();
    try {
      if (typeof window !== "undefined") {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith("campusloop_feed") ||
              key.startsWith("campusloop_cache") ||
              key.startsWith("swr-"))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        setCacheSize("0.0 KB");
      }
      toast.success("Offline timeline cache cleared!");
    } catch {
      toast.error("Could not clear local storage.");
    }
  }

  async function handleSaveSettings(e?: FormEvent) {
    if (e) e.preventDefault();
    if (isSaving || !displayName.trim()) return;

    sounds.tap();
    haptics.medium();
    setIsSaving(true);

    try {
      const cleanAnon = anonUsername
        ? anonUsername.trim().toLowerCase().replace(/^@/, "")
        : null;

      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
          avatarUrl,
          anonymousUsername: cleanAnon,
          feedVisibility,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to save profile changes.");
      }

      sounds.pop();
      haptics.heavy();
      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-3 sm:px-6 py-4 pb-32 text-foreground">
      {/* ─── Mobile-First Top Header ─── */}
      <div className="sticky top-0 z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 py-3 bg-background/95 backdrop-blur-xl border-b border-border/40 flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/feeds"
            className="flex size-9 items-center justify-center rounded-xl border border-border/50 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
            title="Back to Feed"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              Settings &amp; Account
            </h1>
            <p className="text-[11px] text-muted-foreground truncate font-medium">
              @{profile.username} · {profile.institutionName}
            </p>
          </div>
        </div>

        {isDirty && (
          <button
            type="button"
            onClick={() => handleSaveSettings()}
            disabled={isSaving}
            className="flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
          >
            <Check className="size-3.5" />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* ─── 1. Identity & Student Verification Card ─── */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Campus Profile</h2>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
              <ShieldCheck className="size-3 shrink-0" />
              <span>Verified Student</span>
            </div>
          </div>

          {/* Avatar Snapshot + Quick Monogram Reset */}
          <div className="flex items-center gap-4">
            <Avatar className="size-16 sm:size-18 rounded-2xl border-2 border-primary/20 shadow-xs shrink-0">
              <AvatarImage src={currentAvatar} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg rounded-2xl">
                {displayName.charAt(0)?.toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-bold text-foreground truncate">{displayName || "Your Name"}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate font-medium">
                <School className="size-3 text-primary shrink-0" />
                <span>{profile.institutionName}</span>
              </p>
              <button
                type="button"
                onClick={handleResetToMonogram}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline pt-0.5 cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Reset to clean monogram</span>
              </button>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={40}
                placeholder="e.g. Alex Sharma"
                className="h-10 w-full rounded-xl border border-border/60 bg-muted/30 px-3.5 text-xs font-medium text-foreground outline-none transition-all focus:border-primary/50 focus:bg-background"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">Campus Handle</label>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Lock className="size-2.5" /> Locked
                  </span>
                </div>
                <div className="h-10 flex items-center px-3.5 rounded-xl border border-border/50 bg-muted/40 text-xs font-medium text-muted-foreground">
                  @{profile.username}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">Anonymous Alias</label>
                  <span className="text-[10px] text-primary font-mono font-medium">
                    {anonUsername ? `@${anonUsername}` : "auto"}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    @
                  </span>
                  <input
                    type="text"
                    value={anonUsername}
                    onChange={(e) =>
                      setAnonUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    maxLength={24}
                    placeholder="campus_ninja"
                    className="h-10 w-full rounded-xl border border-border/60 bg-muted/30 pl-7 pr-3 text-xs font-medium text-foreground outline-none transition-all focus:border-primary/50 focus:bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">Bio / Campus Vibe</label>
                <span className="text-[10px] text-muted-foreground">{bio.length}/280</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 280))}
                rows={3}
                placeholder="What are you building, studying, or exploring on campus?"
                className="w-full resize-none rounded-xl border border-border/60 bg-muted/30 p-3 text-xs font-medium text-foreground leading-relaxed outline-none transition-all focus:border-primary/50 focus:bg-background"
              />
            </div>
          </div>
        </div>

        {/* ─── 2. Feed & Privacy Preferences ─── */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Sliders className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Timeline &amp; Anonymity Controls</h2>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-foreground">Feed Anonymity Filter</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Switching instantly filters confessions &amp; anonymous posts from your timeline.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleFeedVisibilityChange("ALL")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5",
                  feedVisibility === "ALL"
                    ? "border-primary/50 bg-primary/10 shadow-xs"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40"
                )}
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    feedVisibility === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Globe2 className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">All Posts &amp; Anon</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                    Includes confessions, polls, and student whispers.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleFeedVisibilityChange("NON_ANONYMOUS")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5",
                  feedVisibility === "NON_ANONYMOUS"
                    ? "border-primary/50 bg-primary/10 shadow-xs"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40"
                )}
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    feedVisibility === "NON_ANONYMOUS"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <ShieldCheck className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">Public Only</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                    Hides all anonymous confessions from your feed.
                  </p>
                </div>
              </button>
            </div>

            {/* Default Scope Switcher */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Default Campus Scope</p>
                <p className="text-[10px] text-muted-foreground">Preferred default timeline view.</p>
              </div>

              <div className="flex items-center rounded-xl bg-muted/60 p-0.5 border border-border/50">
                <button
                  type="button"
                  onClick={() => handleScopeChange("GLOBAL")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    defaultScope === "GLOBAL"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All India
                </button>
                <button
                  type="button"
                  onClick={() => handleScopeChange("CAMPUS")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    defaultScope === "CAMPUS"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Campus
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. Audio & Sensory Feedback ─── */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Volume2 className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Audio &amp; Sensory Feedback</h2>
          </div>

          <div className="space-y-3.5">
            {/* In-app Sound Effects */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground">In-App Sound Effects</p>
                  <span className="text-[10px] text-muted-foreground font-medium">(Web Audio)</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Synthesized micro-sounds on likes, reposts, and comments.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {soundEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.pop();
                    }}
                    className="px-2 py-1 rounded-lg border border-border/60 hover:bg-muted text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    title="Test audio chime"
                  >
                    Test
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleToggleSound(!soundEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    soundEnabled ? "bg-primary" : "bg-muted"
                  )}
                  role="switch"
                  aria-checked={soundEnabled}
                  title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                      soundEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Tactile Haptic Vibration */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground">Haptic Vibration</p>
                  <span className="text-[10px] text-muted-foreground font-medium">(Mobile)</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Tactile feedback vibrations on hearts, taps, and navigation.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {hapticsEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      haptics.medium();
                    }}
                    className="px-2 py-1 rounded-lg border border-border/60 hover:bg-muted text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    title="Test vibration pulse"
                  >
                    Test
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleToggleHaptics(!hapticsEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    hapticsEnabled ? "bg-primary" : "bg-muted"
                  )}
                  role="switch"
                  aria-checked={hapticsEnabled}
                  title={hapticsEnabled ? "Disable haptics" : "Enable haptics"}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                      hapticsEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. Media & Network Saver ─── */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Wifi className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Media &amp; Network Saver</h2>
          </div>

          <div className="space-y-3.5">
            {/* Data Saver Mode */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Data Saver Mode</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Reduces image fidelity and pauses background preloads on hostel 4G/Wi-Fi.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleDataSaver(!dataSaver)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                  dataSaver ? "bg-primary" : "bg-muted"
                )}
                role="switch"
                aria-checked={dataSaver}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                    dataSaver ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Video Autoplay */}
            <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Video &amp; Embed Autoplay</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Control inline video and GIF playback on feed.
                </p>
              </div>

              <div className="flex items-center rounded-xl bg-muted/60 p-0.5 border border-border/50 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleAutoplayChange("wifi")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    autoplayMode === "wifi"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Wi-Fi Only
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoplayChange("always")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    autoplayMode === "always"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Always
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoplayChange("never")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    autoplayMode === "never"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Never
                </button>
              </div>
            </div>

            {/* Reduced Motion */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Reduced Motion</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Disables heavy transitions and deck swipes for better performance.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleReducedMotion(!reducedMotion)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                  reducedMotion ? "bg-primary" : "bg-muted"
                )}
                role="switch"
                aria-checked={reducedMotion}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                    reducedMotion ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ─── 5. Direct Messages & Social Privacy ─── */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <MessageSquare className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Messaging &amp; Social Privacy</h2>
          </div>

          <div className="space-y-3.5">
            {/* DM Permissions */}
            <div>
              <p className="text-xs font-semibold text-foreground">Direct Message Permissions</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Control who is allowed to initiate direct chats with you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDmScopeChange("ALL")}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                  dmScope === "ALL"
                    ? "border-primary/50 bg-primary/10 shadow-xs"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40"
                )}
              >
                <p className="text-xs font-bold text-foreground">Everyone</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">All campus members</p>
              </button>

              <button
                type="button"
                onClick={() => handleDmScopeChange("VERIFIED")}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                  dmScope === "VERIFIED"
                    ? "border-primary/50 bg-primary/10 shadow-xs"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40"
                )}
              >
                <p className="text-xs font-bold text-foreground">Verified Only</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Star badge holders</p>
              </button>

              <button
                type="button"
                onClick={() => handleDmScopeChange("MUTUAL")}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                  dmScope === "MUTUAL"
                    ? "border-primary/50 bg-primary/10 shadow-xs"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40"
                )}
              >
                <p className="text-xs font-bold text-foreground">Mutual Follows</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Students you follow</p>
              </button>
            </div>

            {/* Online Status Toggle */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Active Campus Presence</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Show an active dot next to your avatar when browsing CampusLoop.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleOnlineStatus(!onlineStatus)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                  onlineStatus ? "bg-primary" : "bg-muted"
                )}
                role="switch"
                aria-checked={onlineStatus}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                    onlineStatus ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Read Receipts */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Message Read Receipts</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Let peers know when you have seen their chat messages.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleReadReceipts(!readReceipts)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                  readReceipts ? "bg-primary" : "bg-muted"
                )}
                role="switch"
                aria-checked={readReceipts}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                    readReceipts ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ─── 6. Notifications & Device Alerts ─── */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Bell className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Notifications &amp; Alerts</h2>
          </div>

          <div className="space-y-3">
            <PushNotificationToggle />
            <NotificationPreferencesPanel />
          </div>
        </div>

        {/* ─── 7. Local Storage & Offline Cache ─── */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Database className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Storage &amp; Local Cache</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Cached Feed &amp; SWR State</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Offline snapshots stored locally for instant load times.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted/60 border border-border/40 shrink-0">
                {cacheSize}
              </span>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                Clearing cache frees device storage and forces a clean sync without signing you out.
              </p>

              <button
                type="button"
                onClick={handleClearCache}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl border border-border/70 hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <Trash2 className="size-3.5 text-muted-foreground" />
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── 8. Clout, Loop Points & Developer Tools ─── */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Zap className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Rewards &amp; Developer Tools</h2>
          </div>

          {/* Loop Points Bar */}
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Loop Points Balance</p>
                <p className="text-[10px] text-muted-foreground">Unlock Star Student badge at 150 LP.</p>
              </div>
              <span className="text-base font-black text-primary">{profile.points} LP</span>
            </div>

            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${rewardProgress * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
              <span>0 LP</span>
              <span>150 LP (Star Badge)</span>
            </div>
          </div>

          {/* Developer & Referral Links */}
          <div className="divide-y divide-border/40">
            <Link
              href="/developer"
              className="flex items-center justify-between py-2.5 group hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                  <Terminal className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-primary">
                    MCP &amp; Developer API
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Connect Claude Desktop, Cursor, or AI agent sidecars.
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary" />
            </Link>

            <Link
              href={`/@${profile.username}`}
              className="flex items-center justify-between py-2.5 group hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-primary">
                    Invite Students &amp; Earn LP
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Share your campus referral link for +25 LP per signup.
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary" />
            </Link>
          </div>
        </div>

        {/* ─── 9. Appearance & Active Device Session ─── */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Moon className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Theme &amp; Active Session</h2>
          </div>

          {/* Theme Switcher Buttons */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-foreground">App Appearance</p>
              <p className="text-[10px] text-muted-foreground">Select light, dark, or system mode.</p>
            </div>

            <div className="flex items-center rounded-xl bg-muted/60 p-0.5 border border-border/50">
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  setTheme("light");
                }}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                  theme === "light"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Light Mode"
              >
                <Sun className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  setTheme("dark");
                }}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                  theme === "dark"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Dark Mode"
              >
                <Moon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  setTheme("system");
                }}
                className={cn(
                  "px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer",
                  theme === "system"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="System Auto"
              >
                Auto
              </button>
            </div>
          </div>

          {/* Device & Session Telemetry */}
          <div className="pt-2 border-t border-border/40 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {deviceInfo.isMobile ? (
                  <Smartphone className="size-4 text-muted-foreground" />
                ) : (
                  <Laptop className="size-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {deviceInfo.browser} on {deviceInfo.os}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Current verified session token</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Now</span>
              </div>
            </div>
          </div>

          {/* Sign Out Action */}
          <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-foreground">Sign Out of CampusLoop</p>
              <p className="text-[10px] text-muted-foreground">Safely end this session on your device.</p>
            </div>
            <SignOutButton className="inline-flex h-9 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold px-4 transition-all cursor-pointer active:scale-95 shrink-0" />
          </div>
        </div>
      </div>

      {/* ─── Floating Sticky Action Bar for Unsaved Changes ─── */}
      {isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-md rounded-2xl border border-border/70 bg-card/95 p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="min-w-0 pl-1">
            <p className="text-xs font-bold text-foreground">Unsaved Changes</p>
            <p className="text-[10px] text-muted-foreground truncate">Save your updated campus profile.</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="h-8 px-3 rounded-xl border border-border/60 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={isSaving}
              className="h-8 px-4 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
            >
              <Save className="size-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}