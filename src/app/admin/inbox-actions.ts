"use server";

import { revalidatePath } from "next/cache";
import { institutionRequests } from "@/db/schema";
import { hubRequestWhere } from "./_lib/inbox";
import { requireAdminProfile } from "./_lib/guard";

/** Approve or decline a "request my college hub" submission from the inbox. */
export async function decideHubRequest(id: string, decision: "APPROVED" | "REJECTED") {
  const { db } = await requireAdminProfile();
  await db.update(institutionRequests).set({ status: decision }).where(hubRequestWhere(id));
  revalidatePath("/admin");
}
