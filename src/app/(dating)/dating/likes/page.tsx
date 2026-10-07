import type { Metadata } from "next";
import { LikesClient } from "./likes-client";

export const metadata: Metadata = {
  title: "Likes You · Campus Match | CampusLoop",
  description: "See verified students who swiped right on your campus profile.",
};

export default function DatingLikesPage() {
  return <LikesClient />;
}
