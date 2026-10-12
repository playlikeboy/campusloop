import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { merchantUsers, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { getAuthenticatedMerchant } from "@/lib/merchant-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Try direct merchant session cookie
    const directMerchant = await getAuthenticatedMerchant();
    if (directMerchant) {
      return NextResponse.json({
        authenticated: true,
        authType: "DIRECT_CREDENTIALS",
        merchant: directMerchant,
      });
    }

    // 2. Fallback to Hexclave user session - ONLY allow if explicitly linked in merchantUsers
    const user = await hexclaveServerApp.getUser();
    if (user) {
      const db = getDb();
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
      });

      if (profile) {
        const merchantUser = await db.query.merchantUsers.findFirst({
          where: eq(merchantUsers.userId, profile.id),
          with: { merchant: true },
        });

        const linkedMerchant = merchantUser?.merchant;

        // Never fallback to institution's first merchant. Only explicitly associated staff/merchants are permitted.
        if (linkedMerchant) {
          if (
            linkedMerchant.status === "SUSPENDED" ||
            linkedMerchant.status === "CLOSED" ||
            linkedMerchant.status !== "ACTIVE"
          ) {
            return NextResponse.json({ authenticated: false, merchant: null }, { status: 401 });
          }

          return NextResponse.json({
            authenticated: true,
            authType: "HEXCLAVE_STUDENT",
            merchant: linkedMerchant,
            user: profile,
          });
        }
      }
    }

    return NextResponse.json({ authenticated: false, merchant: null }, { status: 401 });
  } catch (error) {
    console.error("Error in merchant auth/me:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
