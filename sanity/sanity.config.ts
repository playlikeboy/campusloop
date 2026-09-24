// Sanity Studio configuration for CampusLoop Atlas
// Submission for DEV Sanity Challenge: Path One (Agent That Queries Real Content)

export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "sekwib79",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-03-01",
  useCdn: false,
};

export default sanityConfig;
