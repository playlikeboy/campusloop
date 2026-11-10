"use client";

import { Shirt } from "lucide-react";
import { ServiceVertical } from "@/components/marketplace/service-vertical";

interface LaundryMarketplaceClientProps {
  profileId: string;
  collegeName?: string;
}

export function LaundryMarketplaceClient({ collegeName }: LaundryMarketplaceClientProps) {
  return (
    <ServiceVertical
      category="laundry"
      title="Laundry"
      description="Get your clothes washed, ironed and folded."
      icon={Shirt}
      collegeName={collegeName}
      listTitle="Prices"
      addLabel="Add"
    />
  );
}
