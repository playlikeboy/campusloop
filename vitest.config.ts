import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { loadLocalEnv } from "./src/lib/load-env";

loadLocalEnv();

export default defineConfig({
	test: {
		include: ["src/**/*.test.ts"],
		environment: "node",
		env: {
			HEXCLAVE_PROJECT_ID: "a0000000-0000-4000-8000-000000000000",
			HEXCLAVE_SECRET_SERVER_KEY: "test_secret_server_key",
		},
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
});
