import { redirect } from "next/navigation";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === "string") {
      sp.set(key, val);
    } else if (Array.isArray(val)) {
      for (const v of val) sp.append(key, v);
    }
  }
  const queryStr = sp.toString();
  redirect(queryStr ? `/explore?${queryStr}` : "/explore");
}
