import { BirthdaysClient } from "@/components/birthdays/birthdays-client";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Birthdays");

export default function BirthdaysPage() {
  return <BirthdaysClient />;
}
