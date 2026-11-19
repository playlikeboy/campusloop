"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "../_lib/guard";
import { clearGa4Cache, fetchLiveSnapshot, ga4LiveConfigured, storeSnapshot } from "../_lib/ga4-report";

export type RefreshResult = { ok: true; fetchedAt: string } | { ok: false; error: string };

/** Pull fresh GA4 numbers through Composio and store them as the fallback snapshot. */
export async function refreshGa4Snapshot(): Promise<RefreshResult> {
  const db = await getAdminDb();
  if (!ga4LiveConfigured()) {
    return { ok: false, error: "Set COMPOSIO_API_KEY and COMPOSIO_GA_ACCOUNT_ID to refresh from GA4." };
  }
  try {
    const snapshot = await fetchLiveSnapshot();
    await storeSnapshot(db, snapshot);
    clearGa4Cache();
    revalidatePath("/admin/analytics");
    return { ok: true, fetchedAt: snapshot.fetchedAt };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "GA4 refresh failed" };
  }
}
