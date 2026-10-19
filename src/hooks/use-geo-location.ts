"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Opt-in precise location. Never prompts on its own: `enable()` must come from a
 * user tap. Once permission is granted, refreshes silently at most every 6 hours.
 * The server rounds coordinates to ~1 km; others only ever see distance buckets.
 */

const LAST_SYNC_KEY = "campusloop_geo_last_sync";
const DISMISS_KEY = "campusloop_geo_prompt_dismissed";
const REFRESH_MS = 6 * 60 * 60 * 1000;

export type GeoPermission = "unsupported" | "prompt" | "granted" | "denied" | "unknown";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage
  }
}

async function sendPosition(pos: GeolocationPosition): Promise<boolean> {
  const res = await fetch("/api/profile/location", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    }),
  });
  if (res.ok) writeStorage(LAST_SYNC_KEY, String(Date.now()));
  return res.ok;
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 10 * 60 * 1000,
      timeout: 15_000,
    })
  );
}

export function useGeoLocation(enabled = true) {
  const [permission, setPermission] = useState<GeoPermission>("unknown");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    setDismissed(readStorage(DISMISS_KEY) === "1");
    if (!("geolocation" in navigator)) {
      setPermission("unsupported");
      return;
    }
    let status: PermissionStatus | null = null;
    const apply = (state: PermissionState) => {
      setPermission(state as GeoPermission);
      if (state === "granted") {
        const last = Number(readStorage(LAST_SYNC_KEY) || 0);
        if (Date.now() - last > REFRESH_MS) {
          void getPosition()
            .then(sendPosition)
            .catch(() => {});
        }
      }
    };
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((s) => {
        status = s;
        apply(s.state);
        s.onchange = () => apply(s.state);
      })
      .catch(() => setPermission("prompt"));
    return () => {
      if (status) status.onchange = null;
    };
  }, [enabled]);

  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const pos = await getPosition();
      const ok = await sendPosition(pos);
      setPermission("granted");
      if (!ok) setError("Could not save your location. Try again.");
      return ok;
    } catch (err) {
      const denied = (err as GeolocationPositionError)?.code === 1;
      setPermission(denied ? "denied" : "prompt");
      setError(denied ? "Location permission was blocked in your browser." : "Could not get your location.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    writeStorage(DISMISS_KEY, "1");
    setDismissed(true);
  }, []);

  const disable = useCallback(async () => {
    await fetch("/api/profile/location", { method: "DELETE" }).catch(() => {});
    writeStorage(LAST_SYNC_KEY, "0");
  }, []);

  return { permission, busy, error, dismissed, enable, dismiss, disable };
}
