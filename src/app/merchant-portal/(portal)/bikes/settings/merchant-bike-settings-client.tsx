"use client";

import { Bike } from "lucide-react";
import Link from "next/link";
import { MerchantPage } from "@/components/merchant/merchant-page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * There is no store-wide rental-rules API yet, so the old form only pretended to save.
 * Price, deposit and pickup spot are set per bike, which is what students actually see.
 */
export function MerchantBikeSettingsClient() {
  return (
    <MerchantPage
      width="narrow"
      title="Rental rules"
      description="Price, deposit and pickup spot for your bikes."
    >
      <EmptyState
        bordered
        icon={Bike}
        title="Rules are set on each bike"
        description="Open a bike to change its price, deposit or pickup spot."
        action={
          <Button asChild>
            <Link href="/merchant-portal/bikes/fleet">Go to your bikes</Link>
          </Button>
        }
      />
    </MerchantPage>
  );
}
