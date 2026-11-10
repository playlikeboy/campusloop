import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";

const ASSETS_DIR = ".open-next/assets";
// Hexclave keeps auth in non-httpOnly cookies; logged-in visitors skip the static landing.
const AUTH_REDIRECT_SCRIPT =
  '<script>if(/(?:^|; )(hexclave|stack)-refresh-/.test(document.cookie))location.replace("/feeds")</script>';

const SNAPSHOT_TARGETS = [
  { path: "", file: "index.html", withAuthRedirect: true },
  { path: "/courses", file: "courses/index.html", altFile: "courses.html" },
  { path: "/courses/cs50-introduction-to-cybersecurity", file: "courses/cs50-introduction-to-cybersecurity/index.html", altFile: "courses/cs50-introduction-to-cybersecurity.html" },
  { path: "/courses/cs50x-introduction-to-computer-science", file: "courses/cs50x-introduction-to-computer-science/index.html", altFile: "courses/cs50x-introduction-to-computer-science.html" },
  { path: "/courses/cs50p-introduction-to-programming-with-python", file: "courses/cs50p-introduction-to-programming-with-python/index.html", altFile: "courses/cs50p-introduction-to-programming-with-python.html" },
  { path: "/courses/cs50w-web-programming-with-python-and-javascript", file: "courses/cs50w-web-programming-with-python-and-javascript/index.html", altFile: "courses/cs50w-web-programming-with-python-and-javascript.html" },
  { path: "/courses/cs50ai-introduction-to-artificial-intelligence-with-python", file: "courses/cs50ai-introduction-to-artificial-intelligence-with-python/index.html", altFile: "courses/cs50ai-introduction-to-artificial-intelligence-with-python.html" },
  { path: "/courses/cs50sql-introduction-to-databases-with-sql", file: "courses/cs50sql-introduction-to-databases-with-sql/index.html", altFile: "courses/cs50sql-introduction-to-databases-with-sql.html" },
  { path: "/courses/category/computer-science", file: "courses/category/computer-science/index.html", altFile: "courses/category/computer-science.html" },
  { path: "/courses/category/web-development", file: "courses/category/web-development/index.html", altFile: "courses/category/web-development.html" },
  { path: "/courses/category/data-science", file: "courses/category/data-science/index.html", altFile: "courses/category/data-science.html" },
  { path: "/courses/category/artificial-intelligence", file: "courses/category/artificial-intelligence/index.html", altFile: "courses/category/artificial-intelligence.html" },
  { path: "/guide", file: "guide/index.html", altFile: "guide.html" },
  { path: "/about", file: "about/index.html", altFile: "about.html" },
  { path: "/safety", file: "safety/index.html", altFile: "safety.html" },
  { path: "/terms", file: "terms/index.html", altFile: "terms.html" },
  { path: "/privacy", file: "privacy/index.html", altFile: "privacy.html" },
  { path: "/contact", file: "contact/index.html", altFile: "contact.html" },
  { path: "/help", file: "help/index.html", altFile: "help.html" },
  { path: "/developers", file: "developers/index.html", altFile: "developers.html" },
  { path: "/investors", file: "investors/index.html", altFile: "investors.html" },
  { path: "/aspirants", file: "aspirants/index.html", altFile: "aspirants.html" },
];

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

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = http.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

async function generateSnapshots() {
  if (process.env.SKIP_LANDING_SNAPSHOT) return;
  const port = await getFreePort();
  console.log(`[deploy] Starting local Next.js snapshot generator on port ${port}...`);

  const child = spawn("npx", ["next", "start", "-p", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(port) },
  });

  const killChild = () => {
    try {
      child.kill("SIGTERM");
    } catch {}
  };

  process.on("exit", killChild);
  process.on("SIGINT", () => {
    killChild();
    process.exit(1);
  });
  process.on("SIGTERM", () => {
    killChild();
    process.exit(1);
  });

  // Wait for server ready
  await new Promise((resolve) => {
    let ready = false;
    const check = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/`, { headers: { "cache-control": "no-cache" } });
        if (res.ok) {
          ready = true;
          return resolve();
        }
      } catch {}
      if (!ready) setTimeout(check, 300);
    };
    child.stdout?.on("data", (d) => {
      const msg = d.toString();
      if ((msg.includes("Ready") || msg.includes("Local:")) && !ready) {
        ready = true;
        resolve();
      }
    });
    setTimeout(check, 500);
    setTimeout(() => {
      if (!ready) resolve();
    }, 8000);
  });

  let snapshottedCount = 0;
  for (const target of SNAPSHOT_TARGETS) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}${target.path}`, { headers: { "cache-control": "no-cache" } });
      if (!res.ok) {
        console.warn(`[deploy] Snapshot fetch failed for ${target.path || "/"}: HTTP ${res.status}`);
        continue;
      }
      let html = await res.text();
      if (!html.includes("<!DOCTYPE html>")) {
        console.warn(`[deploy] Snapshot invalid for ${target.path || "/"}`);
        continue;
      }
      if (target.withAuthRedirect) {
        html = html.replace("<head>", `<head>${AUTH_REDIRECT_SCRIPT}`);
      }
      const dest = path.join(ASSETS_DIR, target.file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, html);

      if (target.altFile) {
        const altDest = path.join(ASSETS_DIR, target.altFile);
        fs.mkdirSync(path.dirname(altDest), { recursive: true });
        fs.writeFileSync(altDest, html);
      }
      snapshottedCount++;
      console.log(`[deploy] Snapshot saved: ${target.path || "/"}`);
    } catch (err) {
      console.warn(`[deploy] Failed snapshot for ${target.path || "/"}: ${err.message}`);
    }
  }

  killChild();
  console.log(`[deploy] Saved ${snapshottedCount} static snapshot(s) to ${ASSETS_DIR}.`);
}

if (wranglerArgs[0] === "deploy" && !process.env.SKIP_LANDING_SNAPSHOT) {
  await generateSnapshots();
}

const code = await runWrangler();
process.exit(code);
