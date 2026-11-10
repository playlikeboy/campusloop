import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hexclaveServerApp } from "@/hexclave/server";
import { privateMetadata } from "@/lib/seo";
import { isAllowedAdminEmail } from "../admin/_lib/session";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = privateMetadata("Admin sign in");

export default async function AdminLoginPage() {
  const user = await hexclaveServerApp.getUser();
  if (user && isAllowedAdminEmail(user.primaryEmail)) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-brand-subtle text-brand-text">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <h1 className="text-2xl text-fg">Admin sign in</h1>
          <p className="text-sm text-fg-muted">Only CampusLoop staff accounts can open the admin console.</p>
        </div>
        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
