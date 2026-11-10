import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { AdminProductsClient } from "./admin-products-client";

export const metadata: Metadata = privateMetadata("Products");

export default function AdminProductsPage() {
  return <AdminProductsClient />;
}
