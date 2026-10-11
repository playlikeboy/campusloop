import type { Metadata } from "next";
import { SettingsClient } from "../../dating/settings/settings-client";

export const metadata: Metadata = {
  title: "Matching Preferences · CampusLoop",
  description: "Update your Matching profile, visibility, and preferences.",
};

export default function MatchingSettingsPage() {
  return <SettingsClient />;
}
