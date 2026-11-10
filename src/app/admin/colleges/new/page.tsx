import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../../_components/admin-page-header";
import { CollegeForm } from "./college-form";

export const metadata: Metadata = privateMetadata("Add a college");

export default function NewCollegePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/colleges"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-fg-muted transition-ui hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to colleges
      </Link>
      <AdminPageHeader
        title="Add a college"
        description="Add the college and the email domains its students use."
      />
      <CollegeForm />
    </div>
  );
}
