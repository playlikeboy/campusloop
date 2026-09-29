"use client";

import type React from "react";
import { SWRConfig } from "swr";
import { AuthRequiredFetchBridge, AuthRequiredOverlay } from "@/components/auth/auth-required-overlay";
import { SWR_STORAGE_KEY } from "@/constants";

let globalSwrMap: Map<string, any> | null = null;

function getLocalStorageProvider() {
  if (typeof window === "undefined") {
    return new Map();
  }

  if (!globalSwrMap) {
    try {
      const raw = localStorage.getItem(SWR_STORAGE_KEY);
      globalSwrMap = new Map(raw ? JSON.parse(raw) : []);
    } catch (e) {
      console.warn("Failed to load SWR cache from localStorage:", e);
      globalSwrMap = new Map();
    }

    const syncToDisk = () => {
      try {
        if (!globalSwrMap) return;
        const serializableEntries: [string, any][] = [];
        let totalSize = 0;
        const MAX_CACHE_BYTES = 4 * 1024 * 1024;

        for (const [key, value] of globalSwrMap.entries()) {
          if (typeof key === "string" && !key.startsWith("$inf$") && value?.data) {
            const serialized = JSON.stringify([key, value]);
            if (totalSize + serialized.length < MAX_CACHE_BYTES) {
              serializableEntries.push([key, value]);
              totalSize += serialized.length;
            }
          }
        }

        localStorage.setItem(SWR_STORAGE_KEY, JSON.stringify(serializableEntries));
      } catch (e) {
        console.warn("Failed to persist SWR cache to localStorage:", e);
      }
    };

    window.addEventListener("beforeunload", syncToDisk);
    window.addEventListener("pagehide", syncToDisk);
  }

  return globalSwrMap;
}

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: getLocalStorageProvider,
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
