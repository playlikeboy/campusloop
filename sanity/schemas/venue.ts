export const venueType = {
  name: "venue",
  title: "Venue",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Venue Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "building",
      title: "Building / Block",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "campusArea",
      title: "Campus Area",
      type: "string",
      description: "e.g. North Campus, Central Campus, Academic Block, Student Center",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "capacity",
      title: "Capacity",
      type: "number",
    },
    {
      name: "amenities",
      title: "Amenities",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    },
  ],
};
