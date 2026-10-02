import fs from "node:fs";
import { spawn } from "node:child_process";

const args = [];
if (fs.existsSync(".env")) {
  args.push("--env-file=.env");
}
args.push("node_modules/wrangler/wrangler-dist/cli.js", ...process.argv.slice(2));

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    OPEN_NEXT_DEPLOY: "true",
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
