import { permanentRedirect } from "next/navigation";

export default function MatchingFiltersRedirect() {
  permanentRedirect("/matching/settings");
}
