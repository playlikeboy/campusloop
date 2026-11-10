/** schema.org ItemList for a page of courses (catalog, topic and search pages). */
export function ItemListJsonLd({ courses }: { courses: { slug: string; title: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: courses.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `https://campusloop.space/courses/${c.slug}`, name: c.title })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
