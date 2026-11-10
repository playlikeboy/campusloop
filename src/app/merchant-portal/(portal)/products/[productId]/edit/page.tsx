import { privateMetadata } from "@/lib/seo";
import { EditProductClient } from "./edit-product-client";

export const metadata = privateMetadata("Edit item");

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = await params;
  return <EditProductClient productId={productId} />;
}
