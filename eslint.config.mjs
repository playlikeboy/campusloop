import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
	{
		ignores: ["node_modules/**", ".next/**", "out/**", "build/**", ".open-next/**", "next-env.d.ts", "cloudflare-env.d.ts"],
	},
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaFeatures: { jsx: true },
				sourceType: "module",
			},
		},
		plugins: {
			"@next/next": nextPlugin,
			"@typescript-eslint": tsPlugin,
			react: reactPlugin,
			"react-hooks": reactHooksPlugin,
		},
		settings: {
			react: { version: "detect" },
		},
		rules: {
			...nextPlugin.configs["core-web-vitals"].rules,
			...tsPlugin.configs.recommended.rules,
			...reactHooksPlugin.configs.recommended.rules,
			"react/react-in-jsx-scope": "off",
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/refs": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"@next/next/no-img-element": "warn",
			"react/no-array-index-key": "warn",
			"max-lines": ["warn", { max: 1000, skipBlankLines: true, skipComments: true }],
		},
	},
	{
		// Client components should use the shared request helpers for consistent error handling and timeouts.
		files: ["src/components/**/*.{ts,tsx}", "src/app/**/*-client.{ts,tsx}"],
		rules: {
			"no-restricted-globals": [
				"warn",
				{
					name: "fetch",
					message: "Use fetcher/apiRequest from @/lib/api instead of raw fetch() in client UI.",
				},
			],
		},
	},
	{
		// Vendored animation primitives (animate-ui) — upstream code relies on
		// render-time ref access; refactoring would break upgrade compatibility.
		files: ["src/components/animate-ui/**"],
		rules: {
			"react-hooks/static-components": "off",
			"react-hooks/refs": "off",
		},
	},
];
