import type { Metadata } from "next";
import { CollegeRequestClient } from "./request-client";

export const metadata: Metadata = {
  title: "Request Your College | CampusLoop",
  description: "Request CampusLoop to index your college and its official student email domain.",
  robots: { index: false, follow: false },
};

export default function CollegeRequestPage() {
  return <CollegeRequestClient />;
}
