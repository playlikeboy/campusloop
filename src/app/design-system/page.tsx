import type { Metadata } from "next";
import { DesignSystemClient } from "./design-system-client";

export const metadata: Metadata = {
  title: "CampusLoop Design System",
  description: "Centralized design system primitives, color tokens, and typography hierarchy.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DesignSystemPage() {
  return <DesignSystemClient />;
}
