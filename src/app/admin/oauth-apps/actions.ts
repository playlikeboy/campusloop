"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { oauthClients } from "@/db/schema";
import { SENSITIVE_SCOPES } from "@/lib/oauth/config";
import { requireAdminProfile } from "../_lib/guard";

type Action = "approve" | "reject" | "suspend" | "activate" | "first-party" | "third-party";

/** Admin review of Login with CampusLoop apps. */
export async function moderateOauthApp(id: string, action: Action, note?: string) {
  const { db } = await requireAdminProfile();
  const app = await db.query.oauthClients.findFirst({ where: eq(oauthClients.id, id) });
  if (!app) throw new Error("App not found");
  const sensitive = app.requestedScopes.filter((s) => SENSITIVE_SCOPES.includes(s));
  const set: Partial<typeof oauthClients.$inferInsert> = { updatedAt: new Date() };
  if (action === "approve")
    Object.assign(set, { approvedScopes: sensitive, reviewStatus: "APPROVED", reviewNote: note || null });
  if (action === "reject")
    Object.assign(set, {
      approvedScopes: [],
      reviewStatus: "REJECTED",
      reviewNote: note || "Not enough reason to share this data",
    });
  if (action === "suspend") Object.assign(set, { status: "SUSPENDED", reviewNote: note || app.reviewNote });
  if (action === "activate") Object.assign(set, { status: "ACTIVE" });
  if (action === "first-party")
    Object.assign(set, {
      isFirstParty: true,
      sector: "campusloop",
      approvedScopes: SENSITIVE_SCOPES,
      reviewStatus: "APPROVED",
    });
  if (action === "third-party") Object.assign(set, { isFirstParty: false, sector: null });
  await db.update(oauthClients).set(set).where(eq(oauthClients.id, id));
  revalidatePath("/admin/oauth-apps");
}
