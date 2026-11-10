import { privateMetadata } from "@/lib/seo";
import { CrushClient } from "./crush-client";

export const metadata = privateMetadata("Secret Crush");

export default function SecretCrushPage() {
  return <CrushClient />;
}
