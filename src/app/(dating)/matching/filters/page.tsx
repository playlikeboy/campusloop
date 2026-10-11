import { redirect } from "next/navigation";

export default function MatchingFiltersRedirect() {
  redirect("/matching/settings");
}
