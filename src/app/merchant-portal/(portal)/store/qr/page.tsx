import { privateMetadata } from "@/lib/seo";
import { MerchantQrClient } from "./merchant-qr-client";

export const metadata = privateMetadata("QR poster");

export default function MerchantQrPage() {
  return <MerchantQrClient />;
}
