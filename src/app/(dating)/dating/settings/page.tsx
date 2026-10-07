import type { Metadata } from "next";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Matching Preferences · Campus Match | CampusLoop",
  description: "Customize your campus match deck radius, gender filters, and visibility.",
};

export default function DatingSettingsPage() {
  return <SettingsClient />;
}
