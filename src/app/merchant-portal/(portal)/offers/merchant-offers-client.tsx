"use client";

import { Tag } from "lucide-react";
import { MerchantPage } from "@/components/merchant/merchant-page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const TEAM_CONTACT = "https://www.instagram.com/campusloop.space/";

/** Offers can't be created from the dashboard yet, so this screen says so plainly. */
export function MerchantOffersClient() {
  return (
    <MerchantPage width="narrow" title="Offers" description="Discounts and promo codes for students.">
      <EmptyState
        bordered
        icon={Tag}
        title="You can't add offers here yet"
        description="Message the CampusLoop team and we'll set one up for you."
        action={
          <Button asChild variant="outline">
            <a href={TEAM_CONTACT} target="_blank" rel="noopener noreferrer">
              Message the team
            </a>
          </Button>
        }
      />
    </MerchantPage>
  );
}
