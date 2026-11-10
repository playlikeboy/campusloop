"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { NotificationPreferencesPanel } from "@/components/notifications/notification-preferences-panel";
import { PushNotificationToggle } from "@/components/notifications/push-notification-toggle";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { SettingsLink, SettingsRow, SettingsSection } from "./settings-ui";

export function NotificationsSection() {
  return (
    <section aria-labelledby="settings-notifications" className="space-y-2">
      <h2 id="settings-notifications" className="px-1 text-lg text-fg">
        Notifications
      </h2>
      <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
        <PushNotificationToggle />
        <NotificationPreferencesPanel />
      </div>
    </section>
  );
}

export function MoreSection({ username }: { username: string }) {
  return (
    <SettingsSection id="settings-more" title="More">
      <SettingsLink
        href={`/@${username}?view=public`}
        label="See my public profile"
        description="What people see before they log in."
      />
      <SettingsLink
        href="/settings/connected-apps"
        label="Connected apps"
        description="Apps you've signed in to with CampusLoop."
      />
      <SettingsLink href="/developer" label="Developer tools" description="API keys and docs." />
      <SettingsLink href="/safety" label="Safety and reporting" />
      <SettingsLink href="/help" label="Help" />
    </SettingsSection>
  );
}

function deviceName() {
  const ua = navigator.userAgent;
  const browser = ua.includes("Edg")
    ? "Edge"
    : ua.includes("Chrome")
      ? "Chrome"
      : ua.includes("Firefox")
        ? "Firefox"
        : ua.includes("Safari")
          ? "Safari"
          : "Browser";
  const os = ua.includes("Android")
    ? "Android"
    : /iPhone|iPad/.test(ua)
      ? "iOS"
      : ua.includes("Mac")
        ? "macOS"
        : ua.includes("Windows")
          ? "Windows"
          : ua.includes("Linux")
            ? "Linux"
            : "this device";
  return `${browser} on ${os}`;
}

export function DeviceSection() {
  const [device, setDevice] = useState("This device");

  useEffect(() => setDevice(deviceName()), []);

  function clearCache() {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("campusloop_feed") || key.startsWith("campusloop_cache") || key.startsWith("swr-"))
        ) {
          keys.push(key);
        }
      }
      for (const k of keys) localStorage.removeItem(k);
      toast.success("Saved feed data cleared");
    } catch {
      toast.error("Couldn't clear saved data on this browser.");
    }
  }

  return (
    <SettingsSection id="settings-device" title="This device">
      <SettingsRow
        label="Clear saved feed data"
        description="Frees space. Your account and posts are not affected."
      >
        <Button variant="outline" size="sm" onClick={clearCache}>
          Clear
        </Button>
      </SettingsRow>
      <SettingsRow label="Signed in on" description={device}>
        <SignOutButton size="sm" className="text-danger" />
      </SettingsRow>
    </SettingsSection>
  );
}
