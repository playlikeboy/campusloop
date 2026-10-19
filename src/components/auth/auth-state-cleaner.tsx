"use client";

import { useEffect } from "react";

/**
 * Client-side resilience component to purge any poisoned auth redirect loop states
 * from browser sessionStorage (e.g. from previously visited broken URLs like
 * ?after_auth_return_to=/handler/sign-in) and clean self-referential search params.
 */
export function AuthStateCleaner() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Clean poisoned sessionStorage keys written by Hexclave/Stack SDK
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.includes("redirect-back-state")) {
          const raw = sessionStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              const target = parsed?.afterAuthReturnTo;
              if (
                typeof target === "string" &&
                (target.includes("/handler") ||
                  target.includes("/sign-in") ||
                  target.includes("/sign-up") ||
                  target.includes("/login") ||
                  target.includes("/register") ||
                  target.includes("/sign-out"))
              ) {
                sessionStorage.removeItem(key);
              }
            } catch {
              sessionStorage.removeItem(key);
            }
          }
        }
      }
    } catch {}

    // 2. Clean URL query parameters if they carry self-referential auth routes
    try {
      const url = new URL(window.location.href);
      const afterAuth = url.searchParams.get("after_auth_return_to");
      const returnTo = url.searchParams.get("returnTo");
      const redirectParam = url.searchParams.get("redirect");

      const isPoisoned = (val: string | null) =>
        Boolean(
          val &&
            (val.includes("/handler") ||
              val.includes("/sign-in") ||
              val.includes("/sign-up") ||
              val.includes("/login") ||
              val.includes("/register") ||
              val.includes("/sign-out"))
        );

      let modified = false;
      if (isPoisoned(afterAuth)) {
        url.searchParams.delete("after_auth_return_to");
        modified = true;
      }
      if (isPoisoned(returnTo)) {
        url.searchParams.delete("returnTo");
        modified = true;
      }
      if (isPoisoned(redirectParam)) {
        url.searchParams.delete("redirect");
        modified = true;
      }

      if (modified) {
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
    } catch {}

    // 3. Purge client storage and cookies when returning from logout
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("logged_out") === "1") {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {}

        if (typeof document !== "undefined") {
          const cookies = document.cookie.split(";");
          for (const c of cookies) {
            const eqPos = c.indexOf("=");
            const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
            if (name) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
            }
          }
        }
      }
    } catch {}
  }, []);

  return null;
}
