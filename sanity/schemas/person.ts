export const personType = {
  name: "person",
  title: "Person / Organizer",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Full Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "role",
      title: "Campus Role / Title",
      type: "string",
      description: "e.g. Lead Organizer, Club President, Faculty Mentor",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "email",
      title: "Email",
      type: "string",
    },
    {
      name: "clubs",
      title: "Associated Clubs",
      type: "array",
      of: [{ type: "reference", to: [{ type: "club" }] }],
    },
    {
      name: "areas",
      title: "Specialties / Focus Areas",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    },
  ],
};
