---
name: "playwright"
description: "Use when the task requires automating a real browser from the terminal for CampusLoop navigation, form filling, snapshots, screenshots, data extraction, and UI-flow debugging."
---

# Playwright CLI Skill

Drive a real browser from the terminal using playwright-cli.

## Required workflow

1. Open the target page.
2. Capture a fresh snapshot.
3. Interact using stable snapshot refs.
4. Re-snapshot after navigation, tab changes, menus, and major DOM changes.
5. Capture screenshots/traces when debugging.

## CampusLoop post QA

Use Playwright for these journeys:

- Home → New Post → Publish → Feed
- Paste image → upload → publish
- Paste YouTube/Instagram/Spotify URL → preview → publish → detail
- Confessions → anonymous mode → publish → anonymous feed
- Offline publish → preserved draft → retry
- Community → compose → publish → community feed
- Post detail → comment → reply
- Edit post → preview → save

Test at:

- 320×800
- 360×800
- 390×844
- 430×932
- desktop

Check:

- no console errors
- no duplicate network uploads
- publish button remains accessible above keyboard
- embeds have loading/error/fallback states
- no layout jump when media appears
- interactive embeds do not trigger feed navigation
- failed requests preserve user content

## Commands

Use the repository's output/playwright directory for artifacts.

~~~bash
playwright-cli open https://campusloop.space --headed
playwright-cli snapshot
playwright-cli click e3
playwright-cli screenshot
~~~

Named sessions should be used for authenticated flows so state remains isolated.

Never claim an E2E flow passed unless it was actually run.
