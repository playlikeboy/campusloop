import groq from "groq";

export const allClubsQuery = groq`
  *[_type == "club"] {
    _id,
    name,
    "slug": slug.current,
    description,
    skills,
    audience,
    beginnerFriendly,
    meetingSchedule,
    membersCount,
    categories[]->{ _id, title, "slug": slug.current },
    leads[]->{ _id, name, role },
    socials
  }
`;

export const allEventsWithRelationsQuery = groq`
  *[_type == "event"] | order(startAt asc) {
    _id,
    title,
    "slug": slug.current,
    startAt,
    endAt,
    skills,
    eligibility,
    beginnerFriendly,
    requiresMembership,
    registrationUrl,
    status,
    description,
    organizer->{
      _id,
      name,
      "slug": slug.current,
      skills,
      beginnerFriendly,
      meetingSchedule
    },
    venue->{
      _id,
      name,
      building,
      campusArea,
      capacity
    },
    categories[]->{
      _id,
      title,
      "slug": slug.current
    }
  }
`;

export const allVenuesQuery = groq`
  *[_type == "venue"] {
    _id,
    name,
    "slug": slug.current,
    building,
    campusArea,
    capacity,
    amenities
  }
`;

export const allAnnouncementsWithRelationsQuery = groq`
  *[_type == "announcement"] | order(publishedAt desc) {
    _id,
    title,
    sourceType,
    publishedAt,
    claimedTimeOrLocation,
    content,
    relatedEvent->{
      _id,
      title,
      startAt,
      venue->{ name, building }
    },
    relatedClub->{
      _id,
      name
    }
  }
`;
