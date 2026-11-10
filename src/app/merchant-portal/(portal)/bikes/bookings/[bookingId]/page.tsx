import { privateMetadata } from "@/lib/seo";
import { MerchantBikeBookingDetailClient } from "./merchant-bike-booking-detail-client";

interface MerchantBikeBookingDetailPageProps {
  params: Promise<{ bookingId: string }>;
}

export const metadata = privateMetadata("Booking");

export default async function MerchantBikeBookingDetailPage({ params }: MerchantBikeBookingDetailPageProps) {
  const { bookingId } = await params;
  return <MerchantBikeBookingDetailClient bookingId={bookingId} />;
}
