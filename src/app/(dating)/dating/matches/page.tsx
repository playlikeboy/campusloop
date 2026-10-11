import { redirect } from "next/navigation";

export default function LegacyMatchingRedirect() {
  redirect("/matching/matches");
}
