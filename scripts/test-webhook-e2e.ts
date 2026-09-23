import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { communities, communityWebhooks, posts, userProfiles } from "../src/db/schema";
import { POST } from "../src/app/api/communities/[id]/webhook/route";

async function runE2ETest() {
  console.log("Starting Community Webhook E2E Test...");
  const db = getDb();

  // Find any community
  const testCommunity = await db.query.communities.findFirst();
  if (!testCommunity) {
    console.error("No community found in DB to test with.");
    process.exit(1);
  }
  console.log(`Using community: ${testCommunity.name} (${testCommunity.id})`);

  // Find or pick a user profile to be the webhook creator
  const testUser =
    (await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, testCommunity.creatorId),
    })) || (await db.query.userProfiles.findFirst());

  if (!testUser) {
    console.error("No user profile found to associate webhook.");
    process.exit(1);
  }

  // Create a temporary test webhook
  const testToken = `cl_wh_test_${Date.now()}`;
  const [createdWebhook] = await db
    .insert(communityWebhooks)
    .values({
      communityId: testCommunity.id,
      name: "E2E Test Webhook",
      token: testToken,
      botName: "AutomationBot",
      isActive: true,
      createdById: testUser.id,
      postsCount: 0,
    })
    .returning();

  console.log(`Created test webhook: ${createdWebhook.id} with token ${testToken}`);

  try {
    // 1. Test missing token
    console.log("\n[Test 1] Testing missing token...");
    const req1 = new Request(`http://localhost:3000/api/communities/${testCommunity.id}/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Hello world" }),
    });
    const res1 = await POST(req1, { params: Promise.resolve({ id: testCommunity.id }) });
    console.log(`Response status: ${res1.status} (Expected: 401)`);
    if (res1.status !== 401) throw new Error("Expected 401 for missing token");

    // 2. Test invalid token
    console.log("\n[Test 2] Testing invalid token...");
    const req2 = new Request(
      `http://localhost:3000/api/communities/${testCommunity.id}/webhook?token=invalid_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "Hello world" }),
      }
    );
    const res2 = await POST(req2, { params: Promise.resolve({ id: testCommunity.id }) });
    console.log(`Response status: ${res2.status} (Expected: 401)`);
    if (res2.status !== 401) throw new Error("Expected 401 for invalid token");

    // 3. Test empty body
    console.log("\n[Test 3] Testing empty body payload...");
    const req3 = new Request(
      `http://localhost:3000/api/communities/${testCommunity.id}/webhook?token=${testToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "" }),
      }
    );
    const res3 = await POST(req3, { params: Promise.resolve({ id: testCommunity.id }) });
    console.log(`Response status: ${res3.status} (Expected: 400)`);
    if (res3.status !== 400) throw new Error("Expected 400 for empty body");

    // 4. Test blocked / unsafe content
    console.log("\n[Test 4] Testing safety moderation filter...");
    const req4 = new Request(
      `http://localhost:3000/api/communities/${testCommunity.id}/webhook?token=${testToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "i will kill and shoot everyone" }),
      }
    );
    const res4 = await POST(req4, { params: Promise.resolve({ id: testCommunity.id }) });
    console.log(`Response status: ${res4.status} (Expected: 400 Content Blocked)`);
    if (res4.status !== 400) throw new Error("Expected 400 for safety blocked content");

    // 5. Test valid posting (Discord-style content field + Bearer token auth)
    console.log("\n[Test 5] Testing valid post with Authorization: Bearer header...");
    const testPostPayload = {
      title: "Automated Build #42 Succeeded",
      content: "All 18 tests passed on staging. Deployment completed in 1.4s.",
      username: "GitHub Actions",
    };
    const req5 = new Request(`http://localhost:3000/api/communities/${testCommunity.id}/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify(testPostPayload),
    });
    const res5 = await POST(req5, { params: Promise.resolve({ id: testCommunity.id }) });
    console.log(`Response status: ${res5.status} (Expected: 201)`);
    if (res5.status !== 201) throw new Error(`Expected 201, got ${res5.status}`);
    const json5 = (await res5.json()) as { postId: string };
    console.log("Created post response:", json5);

    // Verify post was saved in database
    const createdPost = await db.query.posts.findFirst({
      where: eq(posts.id, json5.postId),
    });
    if (!createdPost) throw new Error("Post was not found in posts table");
    console.log(`Verified DB post: [${createdPost.title}] - ${createdPost.body.substring(0, 40)}...`);
    console.log(`Post pseudonym: ${createdPost.pseudonym}`);
    console.log(`Post communityId: ${createdPost.communityId}`);

    // Verify webhook stats incremented
    const updatedWebhook = await db.query.communityWebhooks.findFirst({
      where: eq(communityWebhooks.id, createdWebhook.id),
    });
    console.log(`Webhook postsCount: ${updatedWebhook?.postsCount} (Expected: 1)`);
    if (updatedWebhook?.postsCount !== 1) throw new Error("Webhook postsCount was not incremented");

    // Clean up created post
    await db.delete(posts).where(eq(posts.id, json5.postId));
    console.log("Cleaned up test post.");

    console.log("\nAll 5 E2E Webhook tests PASSED successfully!");
  } finally {
    // Clean up test webhook
    await db.delete(communityWebhooks).where(eq(communityWebhooks.id, createdWebhook.id));
    console.log("Cleaned up test webhook.");
  }
}

runE2ETest()
  .then(() => {
    console.log("E2E Test completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("E2E Test failed:", err);
    process.exit(1);
  });
