// Block and report people. The server drops blocked people from the feed and DMs
// (POST /api/users/:id/block); this phone also hides them right away, including
// in lists the server does not filter (such as comments).
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

import { api } from "./api";

const KEY = "cl.blocked_authors";
let blocked: Set<string> | null = null;
const listeners = new Set<() => void>();

async function load(): Promise<Set<string>> {
  if (blocked) return blocked;
  try {
    blocked = new Set(JSON.parse((await SecureStore.getItemAsync(KEY)) || "[]") as string[]);
  } catch {
    blocked = new Set();
  }
  return blocked;
}

/** Blocks on the server first; throws ApiError if that fails. */
export async function blockUser(profileId: string): Promise<void> {
  await api(`/api/users/${encodeURIComponent(profileId)}/block`, { method: "POST" });
  const set = await load();
  set.add(profileId);
  await SecureStore.setItemAsync(KEY, JSON.stringify([...set]));
  listeners.forEach((fn) => fn());
}

export async function reportUser(profileId: string, reason: string): Promise<void> {
  await api(`/api/users/${encodeURIComponent(profileId)}/report`, { method: "POST", body: { reason } });
}

export async function clearBlocks(): Promise<void> {
  blocked = new Set();
  await SecureStore.deleteItemAsync(KEY);
  listeners.forEach((fn) => fn());
}

export function useBlockedAuthors(): Set<string> {
  const [set, setSet] = useState<Set<string>>(blocked ?? new Set());
  useEffect(() => {
    const update = () => load().then((s) => setSet(new Set(s)));
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);
  return set;
}
