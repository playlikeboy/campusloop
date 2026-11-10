import { privateMetadata } from "@/lib/seo";
import { NewProductClient } from "./new-product-client";

export const metadata = privateMetadata("Add an item");

export default function NewProductPage() {
  return <NewProductClient />;
}
