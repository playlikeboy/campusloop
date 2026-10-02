import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { hexclaveServerApp } from "@/hexclave/server";
import { userProfiles } from "@/db/schema";
import {
  academicResources,
  articles,
  communities,
  events,
  institutions,
  posts,
} from "@/db/schema";

export const dynamic = "force-dynamic";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";
const HOST = "campusloop.space";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

export async function GET(req: NextRequest) {
  try {
    // Authenticate: require either a valid admin session or the matching secret key/token
    const url = new URL(req.url);
    const providedKey =
      url.searchParams.get("key") ||
      url.searchParams.get("token") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      req.headers.get("x-indexnow-key") ||
      req.headers.get("x-cron-secret");

    const cronSecret = process.env.CRON_SECRET;
    const isSecretAuthorized =
      Boolean(providedKey && (providedKey === INDEXNOW_KEY || (cronSecret && providedKey === cronSecret)));

    let isAdmin = false;
    if (!isSecretAuthorized) {
      try {
        const user = await hexclaveServerApp.getUser();
        if (user) {
          const db = getDb();
          const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, user.id),
            columns: { role: true },
          });
          isAdmin = profile?.role === "ADMIN";
        }
      } catch {}
    }

    if (!isSecretAuthorized && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Missing or invalid authentication token or admin role." },
        { status: 401 }
      );
    }

    if (!INDEXNOW_KEY) {
      return NextResponse.json({ error: "IndexNow is not configured" }, { status: 503 });
    }

    const db = getDb();

    // 1. Static Canonical URLs
    const urls: string[] = [
      `https://${HOST}/`,
      `https://${HOST}/academics`,
      `https://${HOST}/academics/sources`,
      `https://${HOST}/colleges`,
      `https://${HOST}/articles`,
      `https://${HOST}/events`,
      `https://${HOST}/communities`,
      `https://${HOST}/overview`,
      `https://${HOST}/pitch`,
      `https://${HOST}/about`,
      `https://${HOST}/demo`,
      `https://${HOST}/safety`,
      `https://${HOST}/privacy`,
      `https://${HOST}/terms`,
      `https://${HOST}/contact`,
    ];

    // 2. Colleges (Canonical public URLs)
    const collegeList = await db.query.institutions.findMany({
      columns: { id: true, slug: true },
      orderBy: [desc(institutions.createdAt)],
      limit: 1500,
    });
    for (const c of collegeList) {
      urls.push(`https://${HOST}/college/${c.slug || c.id}`);
    }

    // 3. Articles (Published Canonical URLs)
    const articleList = await db.query.articles.findMany({
      columns: { slug: true },
      where: eq(articles.status, "PUBLISHED"),
      orderBy: [desc(articles.publishedAt)],
      limit: 1000,
    });
    for (const a of articleList) {
      urls.push(`https://${HOST}/articles/${a.slug}`);
    }

    // 4. Events (Published Canonical URLs)
    const eventList = await db.query.events.findMany({
      columns: { id: true, slug: true },
      where: eq(events.status, "PUBLISHED"),
      orderBy: [desc(events.startDate)],
      limit: 1000,
    });
    for (const e of eventList) {
      urls.push(`https://${HOST}/e/${e.slug || e.id}`);
    }

    // 5. Posts (Public Non-Anonymous Posts)
    const postList = await db.query.posts.findMany({
      columns: { id: true },
      where: eq(posts.status, "PUBLISHED"),
      orderBy: [desc(posts.createdAt)],
      limit: 1000,
    });
    for (const p of postList) {
      urls.push(`https://${HOST}/post/${p.id}`);
    }

    // 6. Communities (Canonical URLs)
    const commList = await db.query.communities.findMany({
      columns: { id: true },
      orderBy: [desc(communities.createdAt)],
      limit: 1000,
    });
    for (const comm of commList) {
      urls.push(`https://${HOST}/communities/${comm.id}`);
    }

    // 7. Student Profiles
    const profileList = await db.query.userProfiles.findMany({
      columns: { username: true },
      orderBy: [desc(userProfiles.createdAt)],
      limit: 1000,
    });
    for (const prof of profileList) {
      if (prof.username) {
        urls.push(`https://${HOST}/@${prof.username}`);
      }
    }

    // 8. Academic Resources (Notes, PYQs, Formula Sheets)
    const academicList = await db.query.academicResources.findMany({
      columns: { id: true },
      orderBy: [desc(academicResources.createdAt)],
      limit: 5000,
    });
    for (const res of academicList) {
      urls.push(`https://${HOST}/app/academics/${res.id}`);
    }

    // IndexNow allows max 10,000 URLs per batch payload
    const batchUrls = urls.slice(0, 10000);
    const [indexNowRes, sitemapRes] = await Promise.all([
      fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: HOST,
          key: INDEXNOW_KEY,
          keyLocation: KEY_LOCATION,
          urlList: batchUrls,
        }),
      }).catch((e) => ({ status: 500, ok: false, error: String(e) })),
      fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(`https://${HOST}/sitemap.xml`)}`).catch(() => null),
    ]);

    return NextResponse.json({
      success: true,
      indexNowStatus: "status" in indexNowRes ? indexNowRes.status : 200,
      totalUrlsSubmitted: batchUrls.length,
    });
  } catch (error) {
    console.error("IndexNow API submission error:", error);
    return NextResponse.json(
      { error: "IndexNow submission failed", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await hexclaveServerApp.getUser();
    let isAuthorized = false;

    if (user) {
      const db = getDb();
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
        columns: { role: true },
      });
      isAuthorized = profile?.role === "ADMIN";
    }

    if (!isAuthorized) {
      const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      const keyHeader = req.headers.get("x-indexnow-key");
      if (authHeader === INDEXNOW_KEY || keyHeader === INDEXNOW_KEY) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!INDEXNOW_KEY) {
      return NextResponse.json({ error: "IndexNow is not configured" }, { status: 503 });
    }

    const body = (await req.json().catch(() => ({}))) as { urls?: string[] };
    const customUrls = body?.urls || [];

    if (customUrls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: customUrls.slice(0, 10000),
    };

    const [indexCentral, bingRes] = await Promise.all([
      fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      }).catch((e) => ({ status: 500, error: String(e) })),
      fetch("https://www.bing.com/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      }).catch((e) => ({ status: 500, error: String(e) })),
    ]);

    return NextResponse.json({
      success: true,
      submittedUrls: customUrls.length,
      indexNowCentralStatus: "status" in indexCentral ? indexCentral.status : 200,
      bingStatus: "status" in bingRes ? bingRes.status : 200,
    });
  } catch (error) {
    console.error("POST indexnow error:", error);
    return NextResponse.json({ error: "Failed to submit URLs" }, { status: 500 });
  }
}
