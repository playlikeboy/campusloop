import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { merchantUsers } from "@/db/schema";
import { getAuthenticatedMerchant } from "@/lib/merchant-auth";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { MerchantLayoutClient } from "../merchant-layout-client";

export const metadata: Metadata = {
  title: "Merchant Portal",
  description: "Manage orders, menu items, business hours, and delivery settings for your campus store.",
  robots: { index: false, follow: false },
};

export default async function MerchantPortalLayout({ children }: { children: React.ReactNode }) {
  // 1. Try direct merchant session cookie
  const directMerchant = await getAuthenticatedMerchant();
  if (directMerchant) {
    return (
      <MerchantLayoutClient
        merchant={directMerchant}
        profile={{
          displayName: directMerchant.name,
          username: directMerchant.loginUsername || directMerchant.slug,
          avatarUrl: directMerchant.logoUrl,
        }}
      >
        {children}
      </MerchantLayoutClient>
    );
  }

  // 2. Fallback to Hexclave user session - ONLY allow if explicitly linked in merchantUsers
  const user = await getCachedAuthUser();
  if (user) {
    const profile = await getCachedUserProfile(user.id);
    if (profile) {
      const db = getDb();
      const merchantUser = await db.query.merchantUsers.findFirst({
        where: eq(merchantUsers.userId, profile.id),
        with: { merchant: true },
      });

      const linkedMerchant = merchantUser?.merchant;
      if (linkedMerchant && linkedMerchant.status === "ACTIVE") {
        return (
          <MerchantLayoutClient profile={profile} merchant={linkedMerchant}>
            {children}
          </MerchantLayoutClient>
        );
      }
    }
  }

  // 3. Not logged in or no authorized merchant link -> Redirect to dedicated merchant login page
  redirect("/merchant-portal/login");
}
