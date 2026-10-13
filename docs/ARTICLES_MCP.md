# 📰 CampusLoop Articles MCP Engine (`/mcp/articles`)

The **CampusLoop Articles MCP Engine** is a high-performance Model Context Protocol (JSON-RPC 2.0) and RESTful API suite powering programmatic authoring, taxonomy management, search, and student journalism across 1,350+ indexed Indian colleges and universities.

---

## 🌐 Endpoints & Protocols

| Endpoint | Method | Format | Purpose |
| :--- | :--- | :--- | :--- |
| `https://campusloop.space/mcp/articles` | `GET` | HTML / JSON / SSE | Interactive portal, REST listing, or SSE transport |
| `https://campusloop.space/mcp/articles` | `POST` | JSON-RPC 2.0 / JSON | MCP tool execution or direct REST article creation |
| `https://campusloop.space/mcp/articles` | `OPTIONS` | CORS | Cross-origin preflight (`*`, methods, headers) |
| `https://campusloop.space/mcp/articles` | `DELETE` | JSON | Direct REST article deletion (`?id=` or `?slug=`) |
| `https://campusloop.space/mcp/articles/openapi.json` | `GET` | OpenAPI 3.1.0 | Machine-readable schema for Composio & agent hubs |
| `https://campusloop.space/api/mcp/articles` | Any | Symmetric | API route aliases matching `/mcp/articles` |

---

## 🔐 Authentication

All mutation operations (creating articles, publishing, editing demo accounts, liking, adding links) require authorization via the CampusLoop MCP API key (`MCP_ARTICLES_API_KEY`, `MCP_API_KEY`, or shared `MCP_EVENTS_API_KEY`):

1. **URL Query Parameter**:
   ```
   https://campusloop.space/mcp/articles?apikey=HBEifejbwhfbiaqDQHW
   ```
2. **HTTP Header (`x-api-key`)**:
   ```http
   x-api-key: HBEifejbwhfbiaqDQHW
   ```
3. **HTTP Authorization Header (Bearer)**:
   ```http
   Authorization: Bearer HBEifejbwhfbiaqDQHW
   ```

*Read-only queries (listing published articles, viewing categories, inspecting OpenAPI specs) are accessible openly or authenticated.*

---

## 🛠️ Registered MCP Tools Catalog (44 Tools)

### 1. Article Lifecycle Management
- **`list_articles`**: List and filter articles with pagination (`page`, `limit`), `status` (`PUBLISHED`, `DRAFT`, `ARCHIVED`), `category`, `tag`, and `authorId`.
- **`get_article`**: Fetch full article details including Markdown content, author, attached external resources, and comment metrics by `articleIdOrSlug`.
- **`search_articles`**: Full-text search across article titles, subtitles, excerpts, and Markdown bodies.
- **`create_article`**: Author a new article with automatic slugification, reading time calculation, excerpt generation, tag assignment, and attached external resource links.
- **`update_article`**: Update an existing article's title, subtitle, content, category, tags, or cover image.
- **`delete_article`**: Permanently remove an article and cascade its associated links/comments.
- **`publish_article`**: Transition an article from `DRAFT` or `ARCHIVED` to `PUBLISHED` and set `publishedAt`.
- **`unpublish_article`**: Transition a published article back to `DRAFT`.
- **`archive_article`**: Archive an article while preserving its relational integrity.
- **`restore_article`**: Restore an archived article back to `PUBLISHED`.

### 2. Category & Taxonomy Engine (38 Categories)
- **`list_categories`**: List all 38 indexed categories, optionally filtered by group (`TECHNOLOGY`, `ACADEMICS`, `LIFESTYLE`).
- **`get_category`**: Get detailed metadata for a category by slug or UUID.
- **`create_category`**: Register a new custom category.
- **`update_category`**: Update category name, description, icon, or sort order.
- **`delete_category`**: Remove a category.

### 3. Tags System
- **`list_tags`**: List popular article tags and usage counts.
- **`create_tag`**: Register a new article hashtag.
- **`update_tag`**: Update tag name or slug.
- **`delete_tag`**: Remove a tag.
- **`add_article_tag`**: Assign a tag to an article.
- **`remove_article_tag`**: Remove a tag association from an article.

### 4. External Resource Links
- **`list_article_links`**: Fetch all attached external links (GitHub repositories, documentation, research papers, live demos, slides) for an article.
- **`add_article_link`**: Attach a new external reading resource or GitHub link to an article.
- **`update_article_link`**: Edit an attached link's title, URL, or type.
- **`delete_article_link`**: Remove an attached link.

### 5. Discussion & Comments
- **`list_comments`**: Fetch threaded comments for an article.
- **`get_comment`**: Retrieve a specific comment by ID.
- **`create_comment`**: Post a new comment on an article.
- **`update_comment`**: Edit comment content.
- **`delete_comment`**: Remove a comment.
- **`reply_to_comment`**: Post a nested reply to an existing comment.
- **`get_article_discussion`**: Retrieve full threaded discussion tree for an article.

### 6. Reactions & Social Signals
- **`like_article`**: Upvote an article (+1) with idempotent student profile binding.
- **`unlike_article`**: Remove upvote from an article.
- **`get_article_likes`**: Get list of student upvoters.
- **`get_article_like_count`**: Retrieve upvotes, downvotes, and net score.
- **`add_comment_reaction`**: Add an emoji reaction to a comment.
- **`remove_comment_reaction`**: Remove an emoji reaction from a comment.

### 7. Author Profiles & Synthetic Demo Accounts
- **`list_authors`**: List student authors publishing on CampusLoop.
- **`get_author`**: Fetch author biography, campus affiliation, and recent articles.
- **`list_demo_accounts`**: List the 30 synthetic demo author profiles available for testing and automated curation.
- **`get_demo_account`**: Inspect a specific demo account's profile metadata.
- **`update_demo_account`**: Programmatically update a demo account's headline, bio, or interests.
- **`get_articles_metadata`**: Platform-wide telemetry (total articles, breakdown by category, total reads/views, and upvotes).

---

## 🗂️ 38 Curated Categories Taxonomy

### Group 1: Technology & Development (10)
1. **Technology and Programming** (`tech-programming` / `TECH_PROGRAMMING`)
2. **Artificial Intelligence and Machine Learning** (`ai-ml` / `AI_ML`)
3. **Web Development** (`web-development` / `WEB_DEVELOPMENT`)
4. **Mobile App Development** (`mobile-dev` / `MOBILE_DEV`)
5. **Data Science and Analytics** (`data-science` / `DATA_SCIENCE`)
6. **Cybersecurity and Privacy** (`cybersecurity` / `CYBERSECURITY`)
7. **Cloud Computing and DevOps** (`cloud-devops` / `CLOUD_DEVOPS`)
8. **Open Source** (`open-source` / `OPEN_SOURCE`)
9. **Electronics and Robotics** (`robotics` / `ROBOTICS`)
10. **Product Development and Engineering** (`product-dev` / `PRODUCT_DEV`)

### Group 2: Academics & Career (10)
11. **Academics and Study Materials** (`academics` / `ACADEMICS`)
12. **Data Structures and Algorithms** (`dsa` / `DSA`)
13. **Placements and Jobs** (`placements-jobs` / `PLACEMENTS_JOBS`)
14. **Internships and Fellowships** (`internships` / `INTERNSHIPS`)
15. **Hackathons and Competitions** (`hackathons` / `HACKATHONS`)
16. **Interview Preparation** (`interview-prep` / `INTERVIEW_PREP`)
17. **Resume and Career Advice** (`career-advice` / `CAREER_ADVICE`)
18. **Scholarships and Education** (`scholarships` / `SCHOLARSHIPS`)
19. **Research and Science** (`research` / `RESEARCH`)
20. **Entrepreneurship and Startups** (`startups` / `STARTUPS`)

### Group 3: Lifestyle & Community (18)
21. **Campus Life and Hostel** (`campus-life` / `CAMPUS_LIFE`)
22. **Student Clubs and Communities** (`student-clubs` / `STUDENT_CLUBS`)
23. **Events and Opportunities** (`events` / `EVENTS`)
24. **Gaming and Esports** (`gaming` / `GAMING`)
25. **Memes and Random Stuff** (`memes` / `MEMES`)
26. **Movies, Anime and Entertainment** (`entertainment` / `ENTERTAINMENT`)
27. **Music and Arts** (`music-arts` / `MUSIC_ARTS`)
28. **Design and Creativity** (`design` / `DESIGN`)
29. **Books and Reading** (`books` / `BOOKS`)
30. **Sports and Fitness** (`sports-fitness` / `SPORTS_FITNESS`)
31. **Health and Wellbeing** (`health-wellbeing` / `HEALTH_WELLBEING`)
32. **Personal Finance and Financial Literacy** (`finance` / `FINANCE`)
33. **Productivity and Self-Improvement** (`productivity` / `PRODUCTIVITY`)
34. **Travel and Local Discovery** (`travel` / `TRAVEL`)
35. **Food and Cooking** (`food` / `FOOD`)
36. **Relationships and Social Life** (`relationships` / `RELATIONSHIPS`)
37. **Sustainability and Environment** (`sustainability` / `SUSTAINABILITY`)
38. **Student Projects and Showcases** (`showcases` / `SHOWCASES`)

---

## 🤖 Synthetic Demo Accounts & Database Seeding

To enable realistic testing, evaluation, and AI agent integration without impacting real student data, CampusLoop provides a dedicated database seeding engine:

### 1. Seeding Data
Run the idempotent seed script using Bun:
```bash
bun scripts/articles/seed-articles.mjs
```
What this does:
- Upserts all **38 categories** into `article_categories`.
- Upserts **30 synthetic demo author accounts** (`demo_tech`, `demo_ai`, `demo_placements`, etc.) in `user_profiles` with `is_seeded = TRUE` and synthetic emails (`demo+...@campusloop.test`).
- Upserts **55 in-depth, original sample articles** in `articles` with `is_demo = TRUE`, attached external resource links (`article_links`), and initial peer comments (`article_comments`).
- Running the script multiple times is safe and idempotent (performs SQL `ON CONFLICT DO UPDATE` or checks for existing keys).

### 2. Cleaning Up Demo Data
To safely remove only synthetic demo data without touching real student content:
```bash
bun scripts/articles/cleanup-articles.mjs
```
This targets strictly `is_demo = TRUE` articles, comments on demo articles, and `is_seeded = TRUE` demo author profiles matching `demo_%`.

---

## 🔌 Composio & External Agent Integration

To connect CampusLoop Articles to Composio:

1. Open your **Composio Dashboard** or execute via Composio CLI:
   ```bash
   composio apps add custom \
     --name "campusloop-articles" \
     --openapi-url "https://campusloop.space/mcp/articles/openapi.json"
   ```
2. Configure authentication:
   - **Type**: API Key
   - **Header Name**: `x-api-key`
   - **Value**: Your MCP key (e.g. `HBEifejbwhfbiaqDQHW`)
3. Connect your favorite LLM (Claude, Cursor, OpenAI GPT-4o, Gemini 2.5 Pro) and start discovering, authoring, and curating student articles across campus!

---

## 🧪 Testing & Verification

Automated test suites verify protocol adherence, CORS, authorization, and tool execution:
```bash
bun test src/app/mcp/articles/route.test.ts
```
Expected output:
```text
✓ CORS & Preflight Handling > responds to OPTIONS with 204 and CORS headers
✓ Authentication Mechanisms > rejects unauthorized REST POST creation requests with HTTP 401
✓ Authentication Mechanisms > rejects unauthorized JSON-RPC mutation tools with HTTP 401
✓ Authentication Mechanisms > authenticates via ?apikey= query param
✓ Authentication Mechanisms > authenticates via x-api-key header
✓ Authentication Mechanisms > authenticates via Authorization: Bearer header
✓ OpenAPI 3.1.0 Endpoint > returns valid OpenAPI 3.1.0 document with security and paths
✓ JSON-RPC 2.0 Protocol & Handshake > handles 'initialize' method correctly
✓ JSON-RPC 2.0 Protocol & Handshake > handles 'notifications/initialized'
✓ JSON-RPC 2.0 Protocol & Handshake > lists all registered tools with required schemas
✓ Tool Execution (tools/call) > calls list_categories tool successfully
✓ Tool Execution (tools/call) > calls list_demo_accounts tool successfully
✓ Tool Execution (tools/call) > calls list_articles with pagination parameters
✓ Tool Execution (tools/call) > calls get_articles_metadata
✓ HTML & REST Discovery (GET /mcp/articles) > renders HTML documentation when Accept header contains text/html
✓ HTML & REST Discovery (GET /mcp/articles) > returns JSON article listing and manifest when Accept header is application/json

16 pass, 0 fail
```
