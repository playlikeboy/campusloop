import type { Metadata } from "next";
import { MarketplaceShellClient } from "@/components/marketplace/marketplace-shell-client";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";

// Pages set their own title and robots. Most marketplace pages need sign-in and are noindex.
export const metadata: Metadata = {
  title: {
    default: "Marketplace",
    template: "%s · CampusLoop",
  },
};

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;
  const viewerMode = profile ? await isViewerProfile(profile) : false;

  return (
    <MarketplaceShellClient profile={profile} viewerMode={viewerMode}>
      {children}
    </MarketplaceShellClient>
  );
}
