import { privateMetadata } from "@/lib/seo";
import { DatingAppClient } from "../dating/dating-app-client";

export const metadata = privateMetadata("Campus Match");

export default function MatchingPage() {
  return <DatingAppClient />;
}
