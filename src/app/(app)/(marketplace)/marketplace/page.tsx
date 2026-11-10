import type { Metadata } from "next";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { MarketplaceClient } from "./marketplace-client";

export const metadata: Metadata = buildMetadata({
  title: "Campus Marketplace",
  description:
    "Order food, groceries and water cans, or book bike rentals, barber slots and laundry from shops near your college.",
  path: "/marketplace",
});

export default async function MarketplacePage() {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Marketplace", path: "/marketplace" }])]} />
      <MarketplaceClient profileId={profile?.id || ""} collegeName={profile?.institution?.name} />
    </>
  );
}
