import type { Metadata } from "next";
import DatingLayout from "../dating/layout";

export const metadata: Metadata = {
  title: {
    default: "CampusLoop Matching",
    template: "%s | CampusLoop Matching",
  },
};

export default function MatchingLayout({ children }: { children: React.ReactNode }) {
  return <DatingLayout>{children}</DatingLayout>;
}
