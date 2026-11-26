"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Capability, type ClientTrust, isVerifyToUnlockBody } from "@/lib/trust";
import { VerifyToUnlockSheet } from "./verify-to-unlock-sheet";

/** Fired by anything that hits a locked action; the provider opens the sheet. */
export const VERIFY_TO_UNLOCK_EVENT = "campusloop:verify-to-unlock";

export function openVerifyToUnlock(capability?: Capability) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(VERIFY_TO_UNLOCK_EVENT, { detail: capability ?? null }));
}

interface TrustContextValue {
  trust?: ClientTrust;
  /** Unknown trust (signed out, static page) answers true: the server still enforces. */
  can: (capability: Capability) => boolean;
  /** Returns true when allowed; otherwise opens the verify sheet and returns false. */
  gate: (capability: Capability) => boolean;
}

const TrustContext = createContext<TrustContextValue>({
  can: () => true,
  gate: () => true,
});

export function useTrust() {
  return useContext(TrustContext);
}

const globalForFetch = globalThis as typeof globalThis & { campusloopVerifyFetchPatched?: boolean };

/**
 * Watches same-origin API responses for the VERIFY_TO_UNLOCK 403 that
 * `requireCapability` returns, so every locked action opens the sheet without
 * each call site handling it. Installed once per page.
 */
function useVerifyFetchWatcher() {
  useEffect(() => {
    if (globalForFetch.campusloopVerifyFetchPatched) return;
    globalForFetch.campusloopVerifyFetchPatched = true;
    const original = window.fetch.bind(window);
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const res = await original(...args);
      if (res.status === 403) {
        try {
          const input = args[0];
          const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
          const sameOrigin = url.startsWith("/") || url.startsWith(window.location.origin);
          if (sameOrigin && url.includes("/api/")) {
            const body: unknown = await res.clone().json();
            if (isVerifyToUnlockBody(body)) openVerifyToUnlock(body.capability);
          }
        } catch {
          // Not JSON or not ours: leave the response alone.
        }
      }
      return res;
    };
  }, []);
}

export function TrustProvider({ trust, children }: { trust?: ClientTrust; children: React.ReactNode }) {
  const [locked, setLocked] = useState<Capability | null | undefined>(undefined);
  useVerifyFetchWatcher();

  useEffect(() => {
    const onLocked = (e: Event) => setLocked((e as CustomEvent<Capability | null>).detail ?? null);
    window.addEventListener(VERIFY_TO_UNLOCK_EVENT, onLocked);
    return () => window.removeEventListener(VERIFY_TO_UNLOCK_EVENT, onLocked);
  }, []);

  const can = useCallback(
    (capability: Capability) => (trust ? trust.allowed.includes(capability) : true),
    [trust]
  );
  const gate = useCallback(
    (capability: Capability) => {
      if (can(capability)) return true;
      setLocked(capability);
      return false;
    },
    [can]
  );
  const value = useMemo(() => ({ trust, can, gate }), [trust, can, gate]);

  return (
    <TrustContext.Provider value={value}>
      {children}
      <VerifyToUnlockSheet
        open={locked !== undefined}
        capability={locked ?? undefined}
        onClose={() => setLocked(undefined)}
      />
    </TrustContext.Provider>
  );
}
