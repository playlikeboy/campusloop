import { AcademicsHubPage, academicsHubMetadata } from "@/components/academics/academics-hub-page";

// Same hub as /academics; canonical points there.
export const metadata = academicsHubMetadata;

export default function StudyMaterialPage(props: { searchParams?: Promise<{ id?: string }> }) {
  return <AcademicsHubPage searchParams={props.searchParams} />;
}
