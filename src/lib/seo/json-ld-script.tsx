import { graphJsonLd, serializeJsonLd } from "./json-ld";

type Thing = Record<string, unknown>;

/**
 * Renders one JSON-LD script for any number of schema nodes.
 *
 *   <JsonLd data={[breadcrumbJsonLd([...]), collegeJsonLd({...})]} />
 */
export function JsonLd({ data }: { data: Thing | Thing[] }) {
  const nodes = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(graphJsonLd(...nodes)) }}
    />
  );
}
