import { privateMetadata } from "@/lib/seo";
import { SettingsClient } from "../../dating/settings/settings-client";

export const metadata = privateMetadata("Campus Match settings");

export default function MatchingSettingsPage() {
  return <SettingsClient />;
}
