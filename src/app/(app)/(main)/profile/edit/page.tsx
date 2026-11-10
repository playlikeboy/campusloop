import { privateMetadata } from "@/lib/seo";
import { EditProfileClient } from "./edit-profile-client";

export const metadata = privateMetadata("Edit profile");

export default function EditProfilePage() {
  return <EditProfileClient />;
}
