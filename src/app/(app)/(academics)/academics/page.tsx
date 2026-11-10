import { AcademicsHubPage, academicsHubMetadata } from "@/components/academics/academics-hub-page";

export const metadata = academicsHubMetadata;

export default function AcademicsPage(props: { searchParams?: Promise<{ id?: string }> }) {
  return <AcademicsHubPage searchParams={props.searchParams} />;
}
