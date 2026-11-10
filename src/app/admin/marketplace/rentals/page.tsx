import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { AdminRentalsClient } from "./admin-rentals-client";

export const metadata: Metadata = privateMetadata("Bike rentals");

export default function AdminRentalsPage() {
  return <AdminRentalsClient />;
}
