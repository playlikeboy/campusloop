"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useSWRConfig } from "swr";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

export function AppPullToRefresh({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const refreshApp = useCallback(async () => {
    // Revalidate active SWR resources first, then refresh server components.
    await mutate(() => true, undefined, { revalidate: true });
    router.refresh();

    // Gives non-SWR client features an opt-in hook for future page-local refreshes.
    window.dispatchEvent(new Event("campusloop:refresh"));
  }, [mutate, router]);

  return <PullToRefresh onRefresh={refreshApp}>{children}</PullToRefresh>;
}
