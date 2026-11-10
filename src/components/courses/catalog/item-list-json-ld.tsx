import { absoluteUrl } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

/** schema.org ItemList for a page of courses (catalog, topic and search pages). */
export function ItemListJsonLd({ courses }: { courses: { slug: string; title: string }[] }) {
  if (courses.length === 0) return null;
  return (
    <JsonLd
      data={{
        "@type": "ItemList",
        itemListElement: courses.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: absoluteUrl(`/courses/${c.slug}`),
          name: c.title,
        })),
      }}
    />
  );
}
