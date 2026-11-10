import { privateMetadata } from "@/lib/seo";
import DatingLayout from "../dating/layout";

export const metadata = privateMetadata("Campus Match");

export default function MatchingLayout({ children }: { children: React.ReactNode }) {
  return <DatingLayout>{children}</DatingLayout>;
}
