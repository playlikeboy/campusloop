"use server";

import { redirect } from "next/navigation";
import { hexclaveServerApp } from "@/hexclave/server";
import { isAllowedAdminEmail } from "../admin/_lib/session";

/** Redirects when access is decided; returns an error message otherwise (thrown messages are hidden in production). */
export async function checkAdminAccess(): Promise<{ error: string }> {
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect("/sign-in?returnTo=/admin");
  }

  if (isAllowedAdminEmail(user.primaryEmail)) {
    redirect("/admin");
  }

  return {
    error: `${user.primaryEmail || "This account"} isn't a staff account. Sign in with a staff account to continue.`,
  };
}
