import { privateMetadata } from "@/lib/seo";
import { NewPlaylistClient } from "./new-playlist-client";

export const metadata = privateMetadata("New study playlist");

export default function NewPlaylistPage() {
  return <NewPlaylistClient />;
}
