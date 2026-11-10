"use client";

import { Scissors } from "lucide-react";
import { ServiceVertical } from "@/components/marketplace/service-vertical";

interface BarberMarketplaceClientProps {
  profileId: string;
  collegeName?: string;
}

export function BarberMarketplaceClient({ collegeName }: BarberMarketplaceClientProps) {
  return (
    <ServiceVertical
      category="barber"
      title="Barber"
      description="Book a haircut or beard trim at a salon near campus."
      icon={Scissors}
      collegeName={collegeName}
      listTitle="Services"
      addLabel="Book"
      footnote="At checkout, choose pickup and pay at the salon."
    />
  );
}
