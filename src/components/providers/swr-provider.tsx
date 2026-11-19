"use client";

import type React from "react";
import { useEffect } from "react";
import { SWRConfig } from "swr";
import { AuthRequiredFetchBridge, AuthRequiredOverlay } from "@/components/auth/auth-required-overlay";
import { SWR_STORAGE_KEY } from "@/constants";

/**
 * In-memory SWR cache. It used to be pre-filled from localStorage, but SWR also uses
 * the cache as its hydration snapshot, so every page with saved data (unread badge,
 * profile) rendered differently from the server HTML and threw React #418. Restoring
 * after mount is not safe either: Suspense boundaries hydrate later and would see it.
 */
export function SWRProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Free the space the old persisted cache took.
    try {
      localStorage.removeItem(SWR_STORAGE_KEY);
    } catch {
      // storage blocked: nothing to clean
    }
  }, []);

  return (
    <SWRConfig
      value={{
        revalidateIfStale: true,
        keepPreviousData: true,
        revalidateOnFocus: true,
        focusThrottleInterval: 30000,
        revalidateOnReconnect: true,
        dedupingInterval: 10000,
        errorRetryCount: 2,
      }}
    >
      {children}
      <AuthRequiredFetchBridge />
      <AuthRequiredOverlay />
    </SWRConfig>
  );
}
