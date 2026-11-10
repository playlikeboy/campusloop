import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser } from "@/lib/server-cache";
import { CartClient } from "./cart-client";

export const metadata: Metadata = privateMetadata("Your cart");

export default async function CartPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  return <CartClient />;
}
