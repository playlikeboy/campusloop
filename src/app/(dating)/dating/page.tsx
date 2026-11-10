import { permanentRedirect } from "next/navigation";

export default function LegacyDatingRedirect() {
  permanentRedirect("/matching");
}
