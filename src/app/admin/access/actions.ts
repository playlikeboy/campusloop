"use server";

import { revalidatePath } from "next/cache";
import { type MemberAccessSettings, normalizeMemberAccess } from "@/lib/trust";
import { saveMemberAccess } from "@/lib/trust-server";
import { requireAdminProfile } from "../_lib/guard";

/** Saves the member access settings. Other Worker isolates pick it up within 60s. */
export async function updateMemberAccess(input: MemberAccessSettings): Promise<MemberAccessSettings> {
  const { profile } = await requireAdminProfile();
  const saved = await saveMemberAccess(normalizeMemberAccess(input));
  console.info(`[admin/access] member access updated by ${profile.id}`);
  revalidatePath("/admin/access");
  return saved;
}
