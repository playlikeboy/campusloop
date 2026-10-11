# Agent Skills and Browser QA

This repository uses workspace-level Agent Skills in `.agents/skills/`, the project skill directory recognized by Google Antigravity.

## Curated skills

| Skill | Role | Source |
| --- | --- | --- |
| `campusloop-guide` | Product architecture, coding conventions, and safe workflows | Maintained in this repository |
| `campusloop-design-qa` | CampusLoop-specific design, trust, responsive, and accessibility QA | Maintained in this repository |
| `impeccable` | Frontend design critique, audit, polishing, and design-system work | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) |
| `web-design-guidelines` | Web interface and accessibility review | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |
| `vercel-react-best-practices` | React/Next.js performance and implementation patterns | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |
| `playwright-cli` | Browser interaction, page inspection, screenshots, and test workflows | [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) |
| `performance` | Evidence-led web performance investigation | Existing repository skill |

## Updating Impeccable

The checked-in Impeccable skill has been synced to upstream version 4.5.2. Keep its `SKILL.md`, reference files, metadata, and helper scripts in sync as a set; do not update only the version string while leaving incompatible helper code behind.

Upstream: https://github.com/pbakaus/impeccable

## Setting up Playwright for local browser testing

The Playwright CLI skill is checked into `.agents/skills/playwright-cli/` so Antigravity can discover the workflow. Browser tooling and browser binaries are machine-specific and are not vendored into the repository.

On a developer checkout, install the development dependencies and let Bun regenerate both `package.json` and `bun.lock` together:

```bash
bun add -d @playwright/cli@latest @playwright/test @axe-core/playwright
bunx playwright install chromium
```

Then verify the CLI is available:

```bash
bunx playwright-cli --help
```

Do not hand-edit `bun.lock` to add dependencies. Commit the package manifest and regenerated lockfile together after checking the resulting diff. If you prefer a globally installed CLI, follow the current installation instructions in the upstream Playwright CLI README.

## Suggested QA commands

Use only after the corresponding dependencies and browser are installed:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
bunx playwright test
```

Check `package.json` for the current script definitions. The Playwright suite must be explicitly configured and its tests created before `bunx playwright test` can provide application coverage. Do not describe the project as browser-tested merely because the CLI is installed.

## Browser test principles

- Prefer deterministic test accounts and non-production data.
- Never send real messages, trigger real purchases, or mutate production user data during visual QA.
- Cover key marketing routes, authentication boundaries, demo flows, empty/error states, responsive layout, and keyboard navigation.
- Keep screenshots and traces free of secrets and private student information.
- Report tested viewports, browser version, observed failures, and limitations.
