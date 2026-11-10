import { Suspense } from "react";
import { PageSpinner } from "@/components/shells/page-loading";
import { privateMetadata } from "@/lib/seo";
import { SavedMaterialsClient } from "./saved-materials-client";

export const metadata = privateMetadata("Saved study material");

export default function SavedAcademicsPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <SavedMaterialsClient />
    </Suspense>
  );
}
