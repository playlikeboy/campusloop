"use client";

import { Droplet } from "lucide-react";
import { ServiceVertical } from "@/components/marketplace/service-vertical";

interface WaterMarketplaceClientProps {
  profileId: string;
  collegeName?: string;
}

export function WaterMarketplaceClient({ collegeName }: WaterMarketplaceClientProps) {
  return (
    <ServiceVertical
      category="water"
      title="Water cans"
      description="Order drinking water cans to your hostel room."
      icon={Droplet}
      collegeName={collegeName}
      listTitle="Cans"
      addLabel="Add"
      footnote="Pay by cash or UPI when it arrives, or online at checkout."
    />
  );
}
