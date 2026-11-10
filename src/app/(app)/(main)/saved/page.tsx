import { privateMetadata } from "@/lib/seo";
import { SavedClient } from "./saved-client";

export const metadata = privateMetadata("Saved");

export default function SavedPostsPage() {
  return <SavedClient />;
}
