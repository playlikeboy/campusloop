import fs from "node:fs";
import { spawn } from "node:child_process";

const ASSETS_DIR = ".open-next/assets";
const SNAPSHOT_FILE = `${ASSETS_DIR}/index.html`;
const SITE_URL = process.env.LANDING_SNAPSHOT_URL || "https://campusloop.space/";
// Hexclave keeps auth in non-httpOnly cookies; logged-in visitors skip the static landing.
const AUTH_REDIRECT_SCRIPT =
  '<script>if(/(?:^|; )(hexclave|stack)-refresh-/.test(document.cookie))location.replace("/feeds")</script>';

const wranglerArgs = process.argv.slice(2);

function runWrangler() {
  const args = [];
  if (fs.existsSync(".env")) {
    args.push("--env-file=.env");
  }
  args.push("node_modules/wrangler/wrangler-dist/cli.js", ...wranglerArgs);

  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      env: { ...process.env, OPEN_NEXT_DEPLOY: "true" },
    });
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

/**
 * Fetches the logged-out landing page from the build that was just deployed.
 * Returns null when no 200 response from this build arrives in time.
 */
async function fetchLandingSnapshot(buildId) {
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const res = await fetch(SITE_URL, { headers: { "cache-control": "no-cache" } });
      const html = await res.text();
      if (res.ok && html.includes(buildId)) return html;
    } catch (error) {
      console.warn(`Landing snapshot attempt ${attempt} failed:`, error.message);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return null;
}

/**
 * shortcut: `/` is served as a static asset snapshot so it never hits the Workers Free
 * 10ms CPU limit. Content refreshes only on deploy; drop this once on Workers Paid.
 */
async function publishLandingSnapshot() {
  const buildId = fs.readFileSync(`${ASSETS_DIR}/BUILD_ID`, "utf8").trim();
  const html = await fetchLandingSnapshot(buildId);
  if (!html) {
    console.warn("Landing snapshot skipped: no 200 response from the new build. `/` stays worker-rendered.");
    return 0;
  }
  fs.writeFileSync(SNAPSHOT_FILE, html.replace("<head>", `<head>${AUTH_REDIRECT_SCRIPT}`));
  console.log("Landing snapshot written, redeploying static `/`.");
  return runWrangler();
}

fs.rmSync(SNAPSHOT_FILE, { force: true });
const code = await runWrangler();
if (code !== 0 || wranglerArgs[0] !== "deploy" || process.env.SKIP_LANDING_SNAPSHOT) {
  process.exit(code);
}
process.exit(await publishLandingSnapshot());
