# CampusLoop Design Decisions Log

This log records design decisions made during the unified design system implementation.

| Date | Topic | Decision | Reason |
| :--- | :--- | :--- | :--- |
| 2026-10-08 | Design System Architecture | Centralize all semantic tokens, typography scales, card elevations, button variants, and badge styles into `@/styles/theme.css` and `@/components/ui/` primitives | Eliminates ad-hoc page styling and ensures 100% consistent visual rhythm. |
| 2026-10-08 | Target Aesthetic | Warm neo-pastel / clean minimal / cute / bright with obsidian dark mode | Appeals directly to Indian collegiate demographic (17-23) while retaining trust for parents and faculty. |
| 2026-10-08 | Semantic Token Calibration | Darkened light mode `--muted-foreground` to `#5E5B55` and `--background` to `#F8F6F1` | Guarantees WCAG AA ≥4.5:1 text contrast compliance across all ambient surfaces while maintaining warm paper aesthetic. |
| 2026-10-08 | Mobile Bottom Navigation Alignment | Standardized `MOBILE_BOTTOM_ITEMS` to Home (/feeds), Colleges (/colleges), Post (/post/new), Chat (/chat), and Dating (/dating) | Fulfills AGENTS.md Rule 6 and brings the 4 core high-retention student surfaces within natural thumb reach. |
| 2026-10-08 | Font Pair Selection | Configured Baloo 2 for rounded friendly headings and Figtree for crisp UI body | Baloo 2 gives collegiate warmth and cute personality without looking childish; Figtree guarantees high x-height legibility. |
| 2026-10-08 | Primary Action Standard | Unified primary action color to `#5B4BFF` and soft secondary action to `--primary-soft` | Eliminates ad-hoc button colors (yellow, green, purple); reserves primary color for the single highest-priority user action. |
| 2026-10-08 | Design System Primitives | Implemented PageContainer, PageHeader, FilterChip, Tag, VerifiedBadge, ListRow, MediaCard, FilterBar in `@/components/ui` | Consolidates layout, tags, badges, and cards into uniform, accessible components with zero inline border/radius drift. |
| 2026-10-08 | Design System Showcase | Created `/design-system` route with noindex robots | Provides interactive live testing and cataloging of all tokens, typography, and primitives. |

