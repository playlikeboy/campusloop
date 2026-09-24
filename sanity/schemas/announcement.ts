export const announcementType = {
  name: "announcement",
  title: "Announcement / Bulletin",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "sourceType",
      title: "Source Type",
      type: "string",
      options: {
        list: [
          { title: "Official College Administration", value: "official-admin" },
          { title: "Club Internal Bulletin", value: "club-flyer" },
          { title: "Student Council Notice", value: "council-notice" },
        ],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "relatedEvent",
      title: "Related Event",
      type: "reference",
      to: [{ type: "event" }],
    },
    {
      name: "relatedClub",
      title: "Related Club",
      type: "reference",
      to: [{ type: "club" }],
    },
    {
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "content",
      title: "Content",
      type: "text",
      rows: 4,
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "claimedTimeOrLocation",
      title: "Claimed Time / Location (for discrepancy detection)",
      type: "string",
      description: "e.g. 'Friday at 5:00 PM' vs official 'Friday at 6:30 PM'",
    },
  ],
};
