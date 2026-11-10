export interface AttendeeRegistration {
  id: string;
  registrationType: "SOLO" | "TEAM";
  teamName: string | null;
  contactPhone: string | null;
  status: "CONFIRMED" | "ATTENDED" | "WAITLISTED" | "CANCELLED";
  createdAt: string;
  profile?: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
    email: string | null;
    course: string | null;
    branch: string | null;
    year: number | null;
    institution?: { name: string } | null;
  } | null;
}

const HEADERS = [
  "Registration ID",
  "Name",
  "Username",
  "Email",
  "Phone",
  "College",
  "Course and branch",
  "Year",
  "Type",
  "Team",
  "Status",
  "Signed up at",
];

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Builds the attendee CSV and starts a download. */
export function downloadAttendeesCsv(registrations: AttendeeRegistration[], eventTitle: string) {
  const rows = registrations.map((r) =>
    [
      r.id,
      r.profile?.displayName,
      r.profile?.username,
      r.profile?.email,
      r.contactPhone,
      r.profile?.institution?.name,
      `${r.profile?.course || ""} ${r.profile?.branch || ""}`.trim(),
      r.profile?.year,
      r.registrationType,
      r.teamName,
      r.status,
      new Date(r.createdAt).toISOString(),
    ]
      .map(cell)
      .join(",")
  );
  const blob = new Blob([[HEADERS.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_attendees.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
