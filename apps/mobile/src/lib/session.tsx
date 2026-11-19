// App-wide sign-in state and the signed-in student's profile.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { api } from "./api";
import { clearTokens, loadTokens, onAuthChange, revokeAndClear, signIn as oauthSignIn } from "./auth";
import { clearBlocks } from "./blocks";
import { registerForPush, unregisterPush } from "./push";
import type { Profile } from "./types";

type Status = "loading" | "signedOut" | "signedIn";

type Session = {
  status: Status;
  me: Profile | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  reloadMe: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [me, setMe] = useState<Profile | null>(null);

  const reloadMe = useCallback(async () => {
    try {
      setMe(await api<Profile>("/api/profile/me"));
    } catch {
      // Screens that need the profile show their own error state.
    }
  }, []);

  useEffect(() => {
    loadTokens().then((tokens) => setStatus(tokens ? "signedIn" : "signedOut"));
    return onAuthChange((signedIn) => {
      setStatus(signedIn ? "signedIn" : "signedOut");
      if (!signedIn) setMe(null);
    });
  }, []);

  useEffect(() => {
    if (status !== "signedIn") return;
    reloadMe();
    registerForPush();
  }, [status, reloadMe]);

  const signIn = useCallback(async () => {
    await oauthSignIn();
  }, []);

  const signOut = useCallback(async () => {
    await unregisterPush();
    await revokeAndClear();
    await clearBlocks();
  }, []);

  // DELETE /api/profile/me removes the account, its OAuth grants and push tokens,
  // so there is nothing left to revoke: just forget the local tokens.
  const deleteAccount = useCallback(async () => {
    await api("/api/profile/me", { method: "DELETE", body: { confirm: "DELETE" } });
    await clearTokens();
    await clearBlocks();
  }, []);

  return <SessionContext.Provider value={{ status, me, signIn, signOut, deleteAccount, reloadMe }}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession outside SessionProvider");
  return ctx;
}
