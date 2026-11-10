import type { Metadata } from "next";
import { MerchantPWAInstallBanner } from "@/components/merchant/merchant-pwa-banner";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...privateMetadata("Store dashboard"),
  description: "Take orders, update your menu and manage your campus store on CampusLoop.",
  manifest: "/manifest-merchant.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CampusLoop Store",
  },
};

/**
 * Metadata shell. The session gate lives in the `(portal)` route group so
 * that `/merchant-portal/login` is reachable while signed out.
 */
export default function MerchantPortalRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MerchantPWAInstallBanner />
    </>
  );
}
