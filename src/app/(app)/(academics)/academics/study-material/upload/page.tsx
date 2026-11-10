import { privateMetadata } from "@/lib/seo";
import { UploadAcademicClient } from "./upload-client";

export const metadata = privateMetadata("Upload notes");

export default function UploadAcademicPage() {
  return <UploadAcademicClient />;
}
