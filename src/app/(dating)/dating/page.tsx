import { redirect } from "next/navigation";

export default function LegacyDatingRedirect() {
  redirect("/matching");
}
