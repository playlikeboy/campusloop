# Daily Academic Material Indexer

This job indexes source links to new academic resources; it never downloads, mirrors, or rehosts the documents.

## Schedule and secrets

- Runs daily at 08:00 India Standard Time (`02:30 UTC`) and can be triggered manually.
- Required repository Actions secrets: `CAMPUSLOOP_ACADEMICS_MCP_API_KEY` and `SERPAPI_API_KEY`.
- If repository Actions are disabled, enable them in GitHub before expecting the native schedule to execute.

## Validation and deduplication

- Reads the existing catalog with MCP offset pagination. If the deployed MCP version ignores offsets, it falls back to the paginated public Academics API; if neither provides a complete scan, the job stops before publishing.
- Normalizes canonical HTTPS URLs, strips tracking parameters, and detects repeated normalized title/course/branch/semester/type combinations.
- Searches official university/government sources and selected open-education sites, then fetches each source directly to verify a usable PDF/page and academic context.
- Requires explicit semester context; ambiguous semester/course data is skipped instead of guessed.
- Rejects placeholder/demo URLs, redirects outside the allowlist, and unsupported content.
- All automatic records are unverified until editor review. The original source is linked and content is never rehosted.
- Caps a daily run at five new records and writes a report containing every new CampusLoop and official source URL, plus duplicate/skip/error counts.

## Run report

`academic-material-report.md` is saved as a 45-day GitHub Actions artifact and appended to the workflow summary.