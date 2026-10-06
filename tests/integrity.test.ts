import { beforeEach, describe, expect, it, mock } from "bun:test";

// ── State variables for tests ──
let currentUser: { id: string } | null = { id: "user_test_1" };
let currentProfile: {
  id: string;
  userId: string;
  institutionId: string;
  role: string;
  points?: number;
} | null = {
  id: "prof_test_1",
  userId: "user_test_1",
  institutionId: "inst_1",
  role: "STUDENT",
  points: 100,
};

let mockMerchant: any = null;
let mockProducts: any[] = [];
let mockEvent: any = null;
let mockRegistrations: any[] = [];
let mockAcademicResource: any = null;
let mockAcademicVotes: any[] = [];
let mockCreatedOrders: any[] = [];
let mockCreatedOrderItems: any[] = [];
let simulateStockConflict = false;

// ── Mock external modules before importing routes ──
mock.module("@/hexclave/server", () => ({
  hexclaveServerApp: {
    getUser: mock(async () => currentUser),
  },
}));

mock.module("@/lib/server-cache", () => ({
  getCachedAuthUser: mock(async () => currentUser),
  getCachedUserProfile: mock(async (userId: string) => {
    if (currentProfile && currentProfile.userId === userId) return currentProfile;
    return null;
  }),
}));

mock.module("@/lib/viewer", () => ({
  rejectViewerWrite: mock(async () => null),
}));

mock.module("@/lib/capabilities", () => ({
  rejectIfLacksCapability: mock(async () => null),
}));

mock.module("@/lib/notifications", () => ({
  createNotification: mock(async () => ({ id: "notif_1" })),
}));

mock.module("@/lib/user-behavior", () => ({
  trackUserBehavior: mock(async () => {}),
}));

mock.module("@/lib/marketplace/order-number", () => ({
  withUniqueOrderNumber: mock(async (fn: (orderNumber: string) => Promise<any>) => {
    return await fn(`CL-${Math.floor(1000 + Math.random() * 9000)}`);
  }),
}));

mock.module("@/lib/redis", () => ({
  getRedis: mock(() => null),
  redis: {
    get: mock(async () => null),
    set: mock(async () => null),
  },
}));

// Mock Database layer
mock.module("@/db", () => ({
  getDb: () => ({
    query: {
      userProfiles: {
        findFirst: mock(async () => currentProfile),
      },
      merchants: {
        findFirst: mock(async () => mockMerchant),
      },
      products: {
        findMany: mock(async () => mockProducts),
        findFirst: mock(async () => mockProducts[0] || null),
      },
      events: {
        findFirst: mock(async () => mockEvent),
      },
      eventRegistrations: {
        findFirst: mock(async (options: any) => {
          // If filtering by eventId and profileId
          return mockRegistrations.find(
            (r) => r.status !== "CANCELLED" && (!currentProfile || r.profileId === currentProfile.id)
          ) || null;
        }),
        findMany: mock(async () => mockRegistrations),
      },
      academicResources: {
        findFirst: mock(async () => mockAcademicResource),
      },
      academicResourceVotes: {
        findFirst: mock(async () => mockAcademicVotes[0] || null),
      },
    },
    update: mock((table: any) => ({
      set: mock((values: any) => ({
        where: mock((condition: any) => ({
          returning: mock(async () => {
            // Check if updating products stock
            if (values.stockQuantity !== undefined) {
              if (simulateStockConflict) {
                return []; // 0 rows affected, simulating concurrent stock exhaustion
              }
              const matchedProd = mockProducts[0];
              if (matchedProd && matchedProd.stockQuantity !== null) {
                matchedProd.stockQuantity -= (matchedProd.lastRequestedQty || 1);
                return [{ id: matchedProd.id, stockQuantity: matchedProd.stockQuantity }];
              }
              return [{ id: "prod_1", stockQuantity: null }];
            }

            // Check if updating academicResources
            if (mockAcademicResource) {
              if (values.viewsCount !== undefined) {
                mockAcademicResource.viewsCount += 1;
              }
              if (values.downloadsCount !== undefined) {
                mockAcademicResource.downloadsCount += 1;
              }
              if (values.upvotesCount !== undefined) {
                mockAcademicResource.upvotesCount += 1;
              }
              if (values.downvotesCount !== undefined) {
                mockAcademicResource.downvotesCount = Math.max(0, mockAcademicResource.downvotesCount - 1);
              }
              return [mockAcademicResource];
            }

            return [{}];
          }),
        })),
      })),
    })),
    insert: mock((table: any) => ({
      values: mock((data: any) => {
        if (Array.isArray(data)) {
          mockCreatedOrderItems.push(...data);
        } else if (data.orderNumber) {
          mockCreatedOrders.push(data);
        } else if (data.voteType) {
          mockAcademicVotes.push(data);
        } else if (data.registrationType) {
          mockRegistrations.push(data);
        }
        return {
          returning: mock(async () => [data]),
          onConflictDoNothing: mock(() => ({
            returning: mock(async () => [data]),
          })),
        };
      }),
    })),
    delete: mock((table: any) => ({
      where: mock(() => ({
        returning: mock(async () => []),
      })),
    })),
    select: mock((fields: any) => ({
      from: mock((table: any) => ({
        where: mock(async () => {
          // Compute participant count: SOLO = 1, TEAM = 1 + members
          let totalParticipants = 0;
          for (const reg of mockRegistrations) {
            if (reg.status === "CANCELLED") continue;
            if (reg.registrationType === "TEAM") {
              const membersCount = Array.isArray(reg.teamMembers) ? reg.teamMembers.length : 0;
              totalParticipants += 1 + membersCount;
            } else {
              totalParticipants += 1;
            }
          }
          return [{ currentParticipants: totalParticipants, attendeeCount: totalParticipants }];
        }),
      })),
    })),
    execute: mock(async (query: any) => {
      // Simulate conditional atomic insert for event registration
      let totalParticipants = 0;
      for (const reg of mockRegistrations) {
        if (reg.status === "CANCELLED") continue;
        if (reg.registrationType === "TEAM") {
          const membersCount = Array.isArray(reg.teamMembers) ? reg.teamMembers.length : 0;
          totalParticipants += 1 + membersCount;
        } else {
          totalParticipants += 1;
        }
      }

      if (mockEvent?.maxParticipants && totalParticipants >= mockEvent.maxParticipants) {
        return { rows: [] };
      }

      return { rows: [{ id: "ereg_1" }] };
    }),
  }),
}));

// Import target routes and standalone caches after mocks are registered
const { POST: checkoutRoute } = await import(
  "@/app/api/marketplace/checkout/route"
);
const { inMemoryIdempotencyCache } = await import("@/lib/idempotency-cache");
const { POST: registerEventRoute } = await import(
  "@/app/api/events/[id]/register/route"
);
const { GET: getEventRoute } = await import("@/app/api/events/[id]/route");
const { POST: analyticsRoute } = await import(
  "@/app/api/academics/[id]/analytics/route"
);
const { clearAnalyticsRateLimits } = await import("@/lib/analytics-cache");

describe("CampusLoop Security & Integrity Test Suite", () => {
  beforeEach(() => {
    // Reset global test state
    currentUser = { id: "user_test_1" };
    currentProfile = {
      id: "prof_test_1",
      userId: "user_test_1",
      institutionId: "inst_1",
      role: "STUDENT",
      points: 100,
    };
    mockCreatedOrders = [];
    mockCreatedOrderItems = [];
    mockRegistrations = [];
    mockAcademicVotes = [];
    simulateStockConflict = false;
    inMemoryIdempotencyCache.clear();
    clearAnalyticsRateLimits();

    mockMerchant = {
      id: "merchant_1",
      name: "Campus Canteen",
      institutionId: "inst_1",
      categorySlug: "food",
      isOpen: true,
      status: "ACTIVE",
      isDeliveryEnabled: true,
      isPickupEnabled: true,
      deliveryFee: 20,
      minOrderValue: 40,
      freeDeliveryAbove: 200,
    };

    mockProducts = [
      {
        id: "prod_samosa",
        merchantId: "merchant_1",
        name: "Crispy Samosa",
        price: 20,
        status: "ACTIVE",
        isAvailable: true,
        stockQuantity: 10,
        lastRequestedQty: 2,
        addons: [{ id: "addon_chutney", name: "Mint Chutney", price: 5 }],
      },
    ];

    mockEvent = {
      id: "event_hackathon",
      slug: "campus-hackathon",
      title: "Campusloop Annual Hackathon",
      organizerProfileId: "prof_organizer",
      institutionId: "inst_1",
      eligibleInstitutionIds: ["ALL"],
      status: "PUBLISHED",
      visibility: "PUBLIC",
      participationType: "BOTH",
      maxParticipants: 10,
      startDate: new Date(Date.now() + 86400000), // tomorrow
      registrationDeadline: new Date(Date.now() + 43200000), // 12 hours from now
      minTeamSize: 2,
      maxTeamSize: 4,
      organizer: {
        id: "prof_organizer",
        username: "lead_organizer",
        displayName: "Lead Organizer",
        avatarUrl: null,
      },
      institution: {
        id: "inst_1",
        name: "BIT Mesra",
        slug: "bit-mesra",
        logoUrl: null,
      },
    };

    mockAcademicResource = {
      id: "res_cs201_notes",
      title: "Data Structures & Algorithms Comprehensive Notes",
      viewsCount: 50,
      downloadsCount: 20,
      upvotesCount: 15,
      downvotesCount: 1,
      subjectCode: "CS201",
      subjectName: "Data Structures",
      branch: "Computer Science",
      semester: 3,
      resourceType: "NOTES",
    };
  });

  // =========================================================================
  // PHASE 12: Marketplace Checkout Atomicity, Pricing & Idempotency
  // =========================================================================
  describe("PHASE 12 — Marketplace Checkout Atomicity", () => {
    it("enforces server-side authoritative pricing and ignores client-spoofed totals/fees", async () => {
      // Client tries to spoof total = 1, deliveryFee = 0, unitPrice = 1
      const spoofedPayload = {
        merchantOrders: [
          {
            merchantId: "merchant_1",
            fulfillmentType: "DELIVERY",
            items: [{ productId: "prod_samosa", quantity: 2 }],
            // Spoofed fields
            subtotal: 2,
            deliveryFee: 0,
            total: 2,
          },
        ],
        deliveryAddress: { hostelName: "Hostel 1", roomNumber: "101", phone: "9876543210" },
      };

      const req = new Request("https://campusloop.space/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(spoofedPayload),
      });

      const res = await checkoutRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Verify authoritative order was created in DB with server calculated amounts
      expect(mockCreatedOrders.length).toBe(1);
      const order = mockCreatedOrders[0];
      // Product price = 20 * 2 = 40. Delivery fee = 20. Total = 60.
      expect(order.subtotal).toBe(40);
      expect(order.deliveryFee).toBe(20);
      expect(order.total).toBe(60);
    });

    it("reserves stock atomically and reduces available inventory", async () => {
      mockProducts[0].stockQuantity = 10;
      mockProducts[0].lastRequestedQty = 3;

      const payload = {
        merchantOrders: [
          {
            merchantId: "merchant_1",
            fulfillmentType: "DELIVERY",
            items: [{ productId: "prod_samosa", quantity: 3 }],
          },
        ],
        deliveryAddress: { phone: "9876543210" },
      };

      const req = new Request("https://campusloop.space/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await checkoutRoute(req);
      expect(res.status).toBe(200);
      // Stock reduced from 10 to 7
      expect(mockProducts[0].stockQuantity).toBe(7);
      expect(mockCreatedOrders.length).toBe(1);
    });

    it("aborts checkout and returns 409 STOCK_CONFLICT when stock reservation fails concurrently", async () => {
      // Pricer sees stock available, but concurrent checkout races and claims it
      mockProducts[0].stockQuantity = 10;
      mockProducts[0].lastRequestedQty = 2;
      simulateStockConflict = true;

      const payload = {
        merchantOrders: [
          {
            merchantId: "merchant_1",
            fulfillmentType: "DELIVERY",
            items: [{ productId: "prod_samosa", quantity: 2 }],
          },
        ],
        deliveryAddress: { phone: "9876543210" },
      };

      const req = new Request("https://campusloop.space/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await checkoutRoute(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe("STOCK_CONFLICT");
      // Zero orders persisted
      expect(mockCreatedOrders.length).toBe(0);
      expect(mockCreatedOrderItems.length).toBe(0);
    });

    it("handles Idempotency-Key to prevent duplicate checkout orders", async () => {
      mockProducts[0].stockQuantity = 10;
      mockProducts[0].lastRequestedQty = 1;

      const payload = {
        merchantOrders: [
          {
            merchantId: "merchant_1",
            fulfillmentType: "PICKUP",
            items: [{ productId: "prod_samosa", quantity: 1 }],
          },
        ],
        deliveryAddress: { phone: "9876543210" },
      };

      const idempotencyKey = "client-uuid-checkout-001";

      const req1 = new Request("https://campusloop.space/api/marketplace/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const res1 = await checkoutRoute(req1);
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.success).toBe(true);
      expect(mockCreatedOrders.length).toBe(1);

      // Replay request with exact same Idempotency-Key
      const req2 = new Request("https://campusloop.space/api/marketplace/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const res2 = await checkoutRoute(req2);
      expect(res2.status).toBe(200);
      expect(res2.headers.get("X-Idempotent-Replay")).toBe("true");
      const data2 = await res2.json();
      expect(data2.primaryOrderId).toBe(data1.primaryOrderId);

      // Orders count remains exactly 1 (no duplicate order created)
      expect(mockCreatedOrders.length).toBe(1);
    });
  });

  // =========================================================================
  // PHASE 10: Event Registration Capacity & Concurrency
  // =========================================================================
  describe("PHASE 10 — Event Registration Capacity", () => {
    it("enforces maxParticipants and rejects registration when event is full", async () => {
      // Event capacity is 10. Already 10 solo participants registered.
      mockEvent.maxParticipants = 10;
      mockRegistrations = Array.from({ length: 10 }, (_, i) => ({
        id: `ereg_${i}`,
        eventId: "event_hackathon",
        profileId: `prof_user_${i}`,
        registrationType: "SOLO",
        status: "CONFIRMED",
      }));

      const req = new Request("https://campusloop.space/api/events/event_hackathon/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationType: "SOLO" }),
      });

      const res = await registerEventRoute(req, {
        params: Promise.resolve({ id: "event_hackathon" }),
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe("CAPACITY_EXCEEDED");
    });

    it("accurately counts team participants (leader + teamMembers) toward event capacity", async () => {
      // Event capacity is 5.
      // Already registered: 1 team of (leader + 2 members) = 3 participants.
      mockEvent.maxParticipants = 5;
      mockRegistrations = [
        {
          id: "ereg_existing_team",
          eventId: "event_hackathon",
          profileId: "prof_other",
          registrationType: "TEAM",
          teamName: "Alpha Coders",
          teamMembers: [{ name: "Alice" }, { name: "Bob" }], // leader + 2 = 3 participants
          status: "CONFIRMED",
        },
      ];

      // New registration requests TEAM with leader + 2 members = 3 participants.
      // Total would be 3 + 3 = 6 > 5. Must be rejected!
      const req = new Request("https://campusloop.space/api/events/event_hackathon/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationType: "TEAM",
          teamName: "Beta Hackers",
          teamMembers: [{ name: "Charlie" }, { name: "David" }],
        }),
      });

      const res = await registerEventRoute(req, {
        params: Promise.resolve({ id: "event_hackathon" }),
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe("CAPACITY_EXCEEDED");
      expect(json.spotsRemaining).toBe(2);
    });

    it("allows team registration when leader + teamMembers fits within remaining capacity", async () => {
      mockEvent.maxParticipants = 5;
      // 1 existing solo participant (4 spots left)
      mockRegistrations = [
        {
          id: "ereg_existing_solo",
          eventId: "event_hackathon",
          profileId: "prof_other",
          registrationType: "SOLO",
          status: "CONFIRMED",
        },
      ];

      // Team of leader + 1 member = 2 participants. 1 + 2 = 3 <= 5.
      const req = new Request("https://campusloop.space/api/events/event_hackathon/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationType: "TEAM",
          teamName: "Pair Coders",
          teamMembers: [{ name: "Alice" }],
        }),
      });

      const res = await registerEventRoute(req, {
        params: Promise.resolve({ id: "event_hackathon" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.registration.teamName).toBe("Pair Coders");
    });

    it("rejects registrations when deadline has passed", async () => {
      mockEvent.registrationDeadline = new Date(Date.now() - 3600000); // 1 hour ago

      const req = new Request("https://campusloop.space/api/events/event_hackathon/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationType: "SOLO" }),
      });

      const res = await registerEventRoute(req, {
        params: Promise.resolve({ id: "event_hackathon" }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("deadline");
    });

    it("rejects registrations when event status is CANCELLED or COMPLETED", async () => {
      mockEvent.status = "CANCELLED";

      const req = new Request("https://campusloop.space/api/events/event_hackathon/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationType: "SOLO" }),
      });

      const res = await registerEventRoute(req, {
        params: Promise.resolve({ id: "event_hackathon" }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("cancelled");
    });

    it("rejects registrations from ineligible campus", async () => {
      mockEvent.eligibleInstitutionIds = ["inst_iit_bombay"];
      currentProfile!.institutionId = "inst_bit_mesra";

      const req = new Request("https://campusloop.space/api/events/event_hackathon/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationType: "SOLO" }),
      });

      const res = await registerEventRoute(req, {
        params: Promise.resolve({ id: "event_hackathon" }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("restricted to specific college students");
    });

    it("prevents duplicate registration for the same student", async () => {
      // User is already registered
      mockRegistrations = [
        {
          id: "ereg_current_student",
          eventId: "event_hackathon",
          profileId: currentProfile!.id,
          registrationType: "SOLO",
          status: "CONFIRMED",
        },
      ];

      const req = new Request("https://campusloop.space/api/events/event_hackathon/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationType: "SOLO" }),
      });

      const res = await registerEventRoute(req, {
        params: Promise.resolve({ id: "event_hackathon" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe("Already registered");
    });
  });

  // =========================================================================
  // PHASE 11: Event Detail Privacy & Performance
  // =========================================================================
  describe("PHASE 11 — Event Detail Privacy & Performance", () => {
    it("public GET computes attendeeCount with SQL and NEVER leaks attendee list or private info", async () => {
      // Add registrations with sensitive private data
      mockRegistrations = [
        {
          id: "reg_student_a",
          eventId: "event_hackathon",
          profileId: "prof_a",
          contactPhone: "+91-9999999999",
          notes: "Dietary requirement: vegan, medical alert",
          registrationType: "SOLO",
          status: "CONFIRMED",
        },
        {
          id: "reg_student_b",
          eventId: "event_hackathon",
          profileId: "prof_b",
          contactPhone: "+91-8888888888",
          registrationType: "TEAM",
          teamName: "Secret Project",
          teamMembers: [{ name: "Bob", email: "secret@example.com" }],
          status: "CONFIRMED",
        },
      ];

      // Request as a public student (not organizer)
      const req = new Request("https://campusloop.space/api/events/event_hackathon", {
        method: "GET",
      });

      const res = await getEventRoute(req, {
        params: Promise.resolve({ id: "event_hackathon" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      const eventData = json.event;

      // 1. attendeeCount is calculated
      expect(eventData.attendeeCount).toBe(3); // 1 solo + (1 leader + 1 member) = 3

      // 2. Registrations list MUST NOT be exposed in public response
      expect(eventData.registrations).toBeUndefined();

      // 3. Sensitive attendee phone numbers and notes are NOT leaked
      const stringified = JSON.stringify(json);
      expect(stringified).not.toContain("+91-9999999999");
      expect(stringified).not.toContain("medical alert");
      expect(stringified).not.toContain("secret@example.com");
    });

    it("public GET returns only the viewer's own userRegistration", async () => {
      mockRegistrations = [
        {
          id: "reg_me",
          eventId: "event_hackathon",
          profileId: currentProfile!.id,
          registrationType: "SOLO",
          status: "CONFIRMED",
        },
      ];

      const req = new Request("https://campusloop.space/api/events/event_hackathon", {
        method: "GET",
      });

      const res = await getEventRoute(req, {
        params: Promise.resolve({ id: "event_hackathon" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.event.isRegistered).toBe(true);
      expect(json.event.userRegistration).toBeDefined();
      expect(json.event.userRegistration.id).toBe("reg_me");
      expect(json.event.registrations).toBeUndefined();
    });
  });

  // =========================================================================
  // PHASE 13: Academic Analytics Abuse
  // =========================================================================
  describe("PHASE 13 — Academic Analytics Abuse", () => {
    it("rejects unauthenticated UPVOTE with 401 Unauthorized", async () => {
      currentUser = null;
      currentProfile = null;

      const req = new Request("https://campusloop.space/api/academics/res_cs201_notes/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPVOTE" }),
      });

      const res = await analyticsRoute(req, {
        params: Promise.resolve({ id: "res_cs201_notes" }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Authentication required");
    });

    it("enforces idempotent upvoting so repeated upvotes do not manipulate the counter", async () => {
      // First upvote
      const req1 = new Request("https://campusloop.space/api/academics/res_cs201_notes/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPVOTE" }),
      });

      const res1 = await analyticsRoute(req1, {
        params: Promise.resolve({ id: "res_cs201_notes" }),
      });

      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.upvotesCount).toBe(16); // 15 + 1
      expect(mockAcademicVotes.length).toBe(1);

      // Repeat upvote by the same user
      const req2 = new Request("https://campusloop.space/api/academics/res_cs201_notes/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPVOTE" }),
      });

      const res2 = await analyticsRoute(req2, {
        params: Promise.resolve({ id: "res_cs201_notes" }),
      });

      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.alreadyVoted).toBe(true);
      // Counter was NOT incremented again!
      expect(data2.upvotesCount).toBe(16);
      expect(mockAcademicVotes.length).toBe(1);
    });

    it("deduplicates rapid VIEW requests to prevent trivial counter manipulation", async () => {
      const initialViews = mockAcademicResource.viewsCount;

      // Request 1: Counted
      const req1 = new Request("https://campusloop.space/api/academics/res_cs201_notes/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.195" },
        body: JSON.stringify({ action: "VIEW" }),
      });

      const res1 = await analyticsRoute(req1, {
        params: Promise.resolve({ id: "res_cs201_notes" }),
      });

      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.viewsCount).toBe(initialViews + 1);

      // Request 2 immediately following from same client: Deduplicated!
      const req2 = new Request("https://campusloop.space/api/academics/res_cs201_notes/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.195" },
        body: JSON.stringify({ action: "VIEW" }),
      });

      const res2 = await analyticsRoute(req2, {
        params: Promise.resolve({ id: "res_cs201_notes" }),
      });

      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.deduplicated).toBe(true);
      // DB Counter remains at initialViews + 1
      expect(data2.viewsCount).toBe(initialViews + 1);
    });

    it("deduplicates rapid DOWNLOAD requests to prevent trivial counter manipulation", async () => {
      const initialDownloads = mockAcademicResource.downloadsCount;

      // Request 1: Counted
      const req1 = new Request("https://campusloop.space/api/academics/res_cs201_notes/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.42" },
        body: JSON.stringify({ action: "DOWNLOAD" }),
      });

      const res1 = await analyticsRoute(req1, {
        params: Promise.resolve({ id: "res_cs201_notes" }),
      });

      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.downloadsCount).toBe(initialDownloads + 1);

      // Request 2 immediately following from same client: Deduplicated!
      const req2 = new Request("https://campusloop.space/api/academics/res_cs201_notes/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.42" },
        body: JSON.stringify({ action: "DOWNLOAD" }),
      });

      const res2 = await analyticsRoute(req2, {
        params: Promise.resolve({ id: "res_cs201_notes" }),
      });

      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.deduplicated).toBe(true);
      // DB Counter remains unchanged
      expect(data2.downloadsCount).toBe(initialDownloads + 1);
    });

    it("allows switching from DOWNVOTE to UPVOTE atomically", async () => {
      // Setup existing DOWNVOTE
      mockAcademicVotes = [
        {
          id: "vote_1",
          resourceId: "res_cs201_notes",
          profileId: currentProfile!.id,
          voteType: "DOWNVOTE",
        },
      ];
      mockAcademicResource.upvotesCount = 10;
      mockAcademicResource.downvotesCount = 3;

      const req = new Request("https://campusloop.space/api/academics/res_cs201_notes/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPVOTE" }),
      });

      const res = await analyticsRoute(req, {
        params: Promise.resolve({ id: "res_cs201_notes" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.userVote).toBe("UPVOTE");
      // Upvotes incremented from 10 to 11, downvotes decremented from 3 to 2
      expect(data.upvotesCount).toBe(11);
      expect(data.downvotesCount).toBe(2);
    });

    it("handles UNDO_UPVOTE correctly", async () => {
      mockAcademicVotes = [
        {
          id: "vote_1",
          resourceId: "res_cs201_notes",
          profileId: currentProfile!.id,
          voteType: "UPVOTE",
        },
      ];
      mockAcademicResource.upvotesCount = 10;

      const req = new Request("https://campusloop.space/api/academics/res_cs201_notes/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UNDO_UPVOTE" }),
      });

      const res = await analyticsRoute(req, {
        params: Promise.resolve({ id: "res_cs201_notes" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.userVote).toBeNull();
    });
  });
});
