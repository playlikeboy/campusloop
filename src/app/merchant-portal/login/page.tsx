import { privateMetadata } from "@/lib/seo";
import { MerchantLoginClient } from "./merchant-login-client";

export const metadata = privateMetadata("Store login");

export default function MerchantLoginPage() {
  return <MerchantLoginClient />;
}
