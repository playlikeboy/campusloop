"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { SettingsRow, SettingsSection, SwitchRow, useLocalPref } from "./settings-ui";

const BOOL = ["true", "false"] as const;
type Visibility = "ALL" | "NON_ANONYMOUS";

function useBoolPref(key: string, fallback: boolean) {
  const [v, set] = useLocalPref(key, fallback ? "true" : "false", BOOL);
  return [v === "true", (next: boolean) => set(next ? "true" : "false")] as const;
}

export function FeedSection({ initialVisibility }: { initialVisibility?: string | null }) {
  const [visibility, setVisibility] = useState<Visibility>(
    initialVisibility === "NON_ANONYMOUS" ? "NON_ANONYMOUS" : "ALL"
  );
  const [scope, setScope] = useLocalPref("campusloop_default_scope", "GLOBAL", ["GLOBAL", "CAMPUS"] as const);

  function broadcast(mode: Visibility) {
    try {
      localStorage.setItem("campusloop_feed_visibility", mode);
    } catch {
      // storage blocked
    }
    window.dispatchEvent(new CustomEvent("campusloop_feed_visibility_change", { detail: mode }));
  }

  async function changeVisibility(mode: Visibility) {
    const previous = visibility;
    setVisibility(mode);
    broadcast(mode);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedVisibility: mode }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      setVisibility(previous);
      broadcast(previous);
      toast.error("Couldn't save this setting. Try again.");
    }
  }

  return (
    <SettingsSection id="settings-feed" title="Feed">
      <SettingsRow label="Anonymous posts" description="Show or hide anonymous posts and confessions." stack>
        <SegmentedControl<Visibility>
          aria-label="Anonymous posts"
          fullWidth
          value={visibility}
          onChange={changeVisibility}
          options={[
            { value: "ALL", label: "Show" },
            { value: "NON_ANONYMOUS", label: "Hide" },
          ]}
        />
      </SettingsRow>
      <SettingsRow label="Open my feed on" stack>
        <SegmentedControl
          aria-label="Default feed"
          fullWidth
          value={scope}
          onChange={setScope}
          options={[
            { value: "GLOBAL", label: "All India" },
            { value: "CAMPUS", label: "My college" },
          ]}
        />
      </SettingsRow>
    </SettingsSection>
  );
}

export function MessagesSection() {
  const [dmScope, setDmScope] = useLocalPref("campusloop_dm_scope", "ALL", [
    "ALL",
    "VERIFIED",
    "MUTUAL",
  ] as const);
  const [online, setOnline] = useBoolPref("campusloop_show_online", true);
  const [receipts, setReceipts] = useBoolPref("campusloop_read_receipts", true);

  return (
    <SettingsSection id="settings-messages" title="Messages">
      <SettingsRow label="Who can message me" stack>
        <SegmentedControl
          aria-label="Who can message me"
          fullWidth
          value={dmScope}
          onChange={setDmScope}
          options={[
            { value: "ALL", label: "Everyone" },
            { value: "VERIFIED", label: "Verified" },
            { value: "MUTUAL", label: "Mutuals" },
          ]}
        />
      </SettingsRow>
      <SwitchRow label="Show when I'm online" checked={online} onChange={setOnline} />
      <SwitchRow
        label="Read receipts"
        description="Let people see when you've read their message."
        checked={receipts}
        onChange={setReceipts}
      />
    </SettingsSection>
  );
}

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem("cl_theme");
    else localStorage.setItem("cl_theme", theme);
  } catch {
    // storage blocked: theme still applies for this visit
  }
  const dark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function AppSection() {
  const [theme, setTheme] = useState<Theme>("system");
  const [sound, setSound] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [dataSaver, setDataSaver] = useBoolPref("campusloop_data_saver", false);
  const [autoplay, setAutoplay] = useLocalPref("campusloop_autoplay", "wifi", [
    "always",
    "wifi",
    "never",
  ] as const);
  const [reducedMotion, setReducedMotion] = useBoolPref("campusloop_reduced_motion", false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cl_theme");
      setTheme(saved === "dark" || saved === "light" ? saved : "system");
    } catch {
      setTheme("system");
    }
    setSound(sounds.isEnabled());
    setVibrate(haptics.isEnabled());
  }, []);

  return (
    <SettingsSection id="settings-app" title="App">
      <SettingsRow label="Theme" stack>
        <SegmentedControl<Theme>
          aria-label="Theme"
          fullWidth
          value={theme}
          onChange={(t) => {
            setTheme(t);
            applyTheme(t);
          }}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "Auto" },
          ]}
        />
      </SettingsRow>
      <SwitchRow
        label="Sounds"
        description="Small sounds when you like, post or send."
        checked={sound}
        onChange={(v) => {
          setSound(v);
          sounds.setEnabled(v);
          if (v) sounds.ting();
        }}
      />
      <SwitchRow
        label="Vibration"
        description="On phones that support it."
        checked={vibrate}
        onChange={(v) => {
          setVibrate(v);
          haptics.setEnabled(v);
          if (v) haptics.medium();
        }}
      />
      <SwitchRow
        label="Data saver"
        description="Load smaller images on slow networks."
        checked={dataSaver}
        onChange={setDataSaver}
      />
      <SettingsRow label="Play videos automatically" stack>
        <SegmentedControl
          aria-label="Play videos automatically"
          fullWidth
          value={autoplay}
          onChange={setAutoplay}
          options={[
            { value: "wifi", label: "On Wi-Fi" },
            { value: "always", label: "Always" },
            { value: "never", label: "Never" },
          ]}
        />
      </SettingsRow>
      <SwitchRow
        label="Reduce motion"
        description="Fewer animations."
        checked={reducedMotion}
        onChange={setReducedMotion}
      />
    </SettingsSection>
  );
}
