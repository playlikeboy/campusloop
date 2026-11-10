"use client";

import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  type NotificationPreferenceSet,
  useNotificationPreferences,
} from "@/hooks/use-notification-preferences";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface PreferenceRow {
  key: keyof NotificationPreferenceSet;
  label: string;
  /** Indented under the row above, and disabled while that row is off. */
  dependsOn?: keyof NotificationPreferenceSet;
}

const ROWS: PreferenceRow[] = [
  { key: "messages", label: "Messages" },
  { key: "followedPosts", label: "New posts from people you follow" },
  { key: "followedPostsFriendsOnly", label: "Only from friends", dependsOn: "followedPosts" },
  { key: "likes", label: "Likes on your posts" },
  { key: "comments", label: "Comments and replies" },
  { key: "mentions", label: "When someone @mentions you" },
  { key: "reposts", label: "Reposts of your posts" },
  { key: "follows", label: "New followers" },
  { key: "matches", label: "Campus Match and Secret Crush" },
];

/**
 * Account-wide notification switches for the settings page.
 *
 * These are the blunt instrument — "never ping me about likes". Silencing one
 * specific person without silencing the whole category is done from that
 * person's profile instead, via `MuteUserButton`.
 */
export function NotificationPreferencesPanel() {
  const { preferences, isLoading, setPreference } = useNotificationPreferences();

  async function handleChange(key: keyof NotificationPreferenceSet, next: boolean) {
    sounds.tap();
    haptics.light();
    const ok = await setPreference(key, next);
    if (!ok) {
      haptics.error();
      toast.error("Couldn't save that. Check your connection and try again.");
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-fg">Notify me about</p>
      <p className="text-sm text-fg-muted">To mute one person, open their profile.</p>
      <ul className={cn("divide-y divide-border pt-2", isLoading && "opacity-60")} aria-busy={isLoading}>
        {ROWS.map((row) => {
          const disabled = isLoading || (row.dependsOn ? !preferences[row.dependsOn] : false);
          return (
            <li key={row.key}>
              <label
                className={cn(
                  "flex min-h-12 items-center justify-between gap-4 py-2",
                  row.dependsOn && "pl-4",
                  disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                )}
              >
                <span className="text-sm text-fg">{row.label}</span>
                <Switch
                  checked={preferences[row.key]}
                  disabled={disabled}
                  onCheckedChange={(v) => handleChange(row.key, Boolean(v))}
                />
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
