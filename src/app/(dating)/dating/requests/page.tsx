import { permanentRedirect } from "next/navigation";

export default function LegacyMatchingRedirect() {
  permanentRedirect("/matching/requests");
}
