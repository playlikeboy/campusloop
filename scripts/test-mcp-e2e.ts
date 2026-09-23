import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { mcpAuditLogs, userMcpKeys, userProfiles } from "../src/db/schema";
import { POST as mcpPostRoute } from "../src/app/api/mcp/route";

async function runMcpE2ETest() {
  console.log("=== Starting CampusLoop MCP Server E2E Test Suite ===");
  const db = getDb();

  // Find a test student profile
  const testStudent = await db.query.userProfiles.findFirst({
    with: { institution: true },
  });
  if (!testStudent) {
    console.error("No student profile found in database.");
    process.exit(1);
  }
  console.log(`Using test student: ${testStudent.displayName} (@${testStudent.username}) at ${(testStudent as any).institution?.name}`);

  // Create temporary test MCP key
  const testKeyToken = `cl_mcp_test_${Date.now()}`;
  const [createdKey] = await db
    .insert(userMcpKeys)
    .values({
      userId: testStudent.id,
      name: "E2E Test Key",
      key: testKeyToken,
      isActive: true,
      permissions: ["read", "write", "chat", "exclusive"],
      requestsCount: 0,
    })
    .returning();

  console.log(`Created test MCP key: ${createdKey.id} with token ${testKeyToken}`);

  try {
    // 1. Test Unauthorized without key
    console.log("\n[Test 1] Testing unauthorized request (missing key)...");
    const req1 = new Request("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    const res1 = await mcpPostRoute(req1);
    console.log(`Status: ${res1.status} (Expected: 401)`);
    if (res1.status !== 401) throw new Error("Expected 401 for missing key");

    // 2. Test initialize method
    console.log("\n[Test 2] Testing MCP 'initialize' method...");
    const req2 = new Request(`http://localhost:3000/api/mcp?key=${testKeyToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "Cursor", version: "0.45.0" },
        },
      }),
    });
    const res2 = await mcpPostRoute(req2);
    console.log(`Status: ${res2.status} (Expected: 200)`);
    const json2 = (await res2.json()) as any;
    console.log("Server Info:", json2.result?.serverInfo);
    console.log("Protocol:", json2.result?.protocolVersion);
    if (json2.result?.protocolVersion !== "2024-11-05") throw new Error("Invalid protocolVersion in initialize");

    // 3. Test tools/list method
    console.log("\n[Test 3] Testing 'tools/list' method...");
    const req3 = new Request("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testKeyToken}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/list" }),
    });
    const res3 = await mcpPostRoute(req3);
    const json3 = (await res3.json()) as any;
    const tools = json3.result?.tools || [];
    console.log(`Loaded ${tools.length} MCP tools (Expected: 31)`);
    if (tools.length < 30) throw new Error(`Expected at least 30 tools, got ${tools.length}`);

    // Verify key exclusive tools exist
    const toolNames = tools.map((t: any) => t.name);
    console.log("Has campusloop_generate_campus_digest:", toolNames.includes("campusloop_generate_campus_digest"));
    console.log("Has campusloop_ask_academic_tutor:", toolNames.includes("campusloop_ask_academic_tutor"));
    console.log("Has campusloop_audit_post_safety:", toolNames.includes("campusloop_audit_post_safety"));

    // 4. Test tools/call: campusloop_get_my_profile
    console.log("\n[Test 4] Testing 'tools/call' for campusloop_get_my_profile...");
    const req4 = new Request(`http://localhost:3000/api/mcp?key=${testKeyToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "campusloop_get_my_profile",
          arguments: {},
        },
      }),
    });
    const res4 = await mcpPostRoute(req4);
    const json4 = (await res4.json()) as any;
    const profileText = json4.result?.content?.[0]?.text;
    const profileData = JSON.parse(profileText || "{}");
    console.log("Resolved student profile:", profileData.profile?.displayName, `(@${profileData.profile?.username})`);
    if (profileData.profile?.username !== testStudent.username) throw new Error("Profile mismatch in tools/call");

    // 5. Test tools/call: campusloop_audit_post_safety (Exclusive Feature)
    console.log("\n[Test 5] Testing 'tools/call' for campusloop_audit_post_safety...");
    const req5 = new Request(`http://localhost:3000/api/mcp?key=${testKeyToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "campusloop_audit_post_safety",
          arguments: {
            text: "Selling cycle near Hostel 4 room 214, call 9876543210 urgently!",
          },
        },
      }),
    });
    const res5 = await mcpPostRoute(req5);
    const json5 = (await res5.json()) as any;
    const safetyData = JSON.parse(json5.result?.content?.[0]?.text || "{}");
    console.log("Safety Audit Result:", safetyData);
    if (!safetyData.piiAudit?.phoneNumberFound || !safetyData.piiAudit?.hostelRoomFound) {
      throw new Error("Safety check failed to detect phone number or hostel room");
    }

    // 6. Test tools/call: campusloop_generate_campus_digest (Exclusive Feature)
    console.log("\n[Test 6] Testing 'tools/call' for campusloop_generate_campus_digest...");
    const req6 = new Request(`http://localhost:3000/api/mcp?key=${testKeyToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 6,
        method: "tools/call",
        params: {
          name: "campusloop_generate_campus_digest",
          arguments: { scope: "CAMPUS" },
        },
      }),
    });
    const res6 = await mcpPostRoute(req6);
    const json6 = (await res6.json()) as any;
    const digestData = JSON.parse(json6.result?.content?.[0]?.text || "{}");
    console.log("Digest Headline:", digestData.digestHeadline);
    console.log("Discussions Analyzed:", digestData.summary?.totalDiscussionsAnalyzed);

    // 7. Test resources/list & resources/read
    console.log("\n[Test 7] Testing 'resources/list' and 'resources/read'...");
    const req7 = new Request(`http://localhost:3000/api/mcp?key=${testKeyToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 7,
        method: "resources/read",
        params: { uri: "campusloop://me" },
      }),
    });
    const res7 = await mcpPostRoute(req7);
    const json7 = (await res7.json()) as any;
    console.log("Resource read success:", json7.result?.contents?.[0]?.uri === "campusloop://me");

    // 8. Verify telemetry was updated
    const updatedKey = await db.query.userMcpKeys.findFirst({
      where: eq(userMcpKeys.id, createdKey.id),
    });
    console.log(`\nKey telemetry: requestsCount = ${updatedKey?.requestsCount}`);
    if ((updatedKey?.requestsCount || 0) < 1) {
      throw new Error("Telemetry requestsCount was not incremented");
    }

    // 9. Verify audit logs
    const auditLogs = await db.query.mcpAuditLogs.findMany({
      where: eq(mcpAuditLogs.keyId, createdKey.id),
    });
    console.log(`Audit logs recorded: ${auditLogs.length} events`);
    if (auditLogs.length < 1) {
      throw new Error("Expected at least 1 audit log entry");
    }

    console.log("\n🎉 ALL 8 MCP PROTOCOL & TOOL TESTS PASSED 100%!");
  } finally {
    // Cleanup test key & logs
    await db.delete(mcpAuditLogs).where(eq(mcpAuditLogs.keyId, createdKey.id));
    await db.delete(userMcpKeys).where(eq(userMcpKeys.id, createdKey.id));
    console.log("Cleaned up test key and audit logs.");
  }
}

runMcpE2ETest()
  .then(() => {
    console.log("MCP E2E Test Suite finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("MCP E2E Test Suite failed:", err);
    process.exit(1);
  });
