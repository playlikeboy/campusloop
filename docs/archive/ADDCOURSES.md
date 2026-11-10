# ADDCOURSES.md: prompt for adding free courses to CampusLoop

> Paste this whole file into your coding agent (Antigravity or any other). It is self-contained: goal, rules, research method, the exact pipeline in this repo, every category with research queries, candidate creators per field, and acceptance checks.

---

## 1. Your role and goal

You are a senior engineer and education researcher working in the CampusLoop repository (Next.js 16 on Cloudflare Workers, Neon Postgres with Drizzle, bun). CampusLoop is a verified-students-only platform for Indian college students. `/courses` is its free learning catalog: Udemy-style course pages, a distraction-free player with progress tracking, notes, Q&A and certificates.

Today the catalog has 417 courses, almost all computing: Harvard CS50 (13), universities (78: MIT OCW, Stanford, CMU, Caltech, NPTEL, DeepLearning.AI, 3Blue1Brown, Karpathy) and Indian coding educators (326: CodeWithHarry, Gate Smashers, Neso Academy, CampusX, Apna College, Striver and others).

**Your goal: expand the catalog to every field college students in India study**, not just coding. That means engineering branches, sciences, medicine, pharmacy, nursing, commerce, finance, economics, management, law, humanities, social sciences, psychology, design, architecture, media, languages, competitive exams and career skills. Aim for **at least 8–15 high-quality courses per category**, in English and Hindi, and in regional languages where good full courses exist. Each one should be a complete, structured series from an official channel.

Students should find a full free course for every subject on their semester syllabus.

---

## 2. Non-negotiable rules

1. **Official sources only.** Import only from the creator's or university's own YouTube channel. Never from re-uploads, compilations or "lecture dump" channels. Check the channel's verified badge, its subscriber count, and that the official website links back to it.
2. **Never fabricate signals.** No fake ratings, reviews, enrolments, views or certificates. Ranking help goes only through `courses.rank_boost` (see §6).
3. **Attribution stays.** Every imported course keeps:
   - `source_url`, the original playlist.
   - `provider`, the creator name.
   - The attribution line rendered by `attributionNote()` / `courseProvider()` in `src/lib/courses/format.ts`.

   Set `license` only when the channel states one, for example MIT OCW is `CC BY-NC-SA 4.0`.
4. **No broken lectures.** The importer drops private, deleted, live/upcoming videos and shorts under 90 seconds. Videos whose owner disabled embedding become "Watch on YouTube" link lectures. Never bypass these checks.
5. **No paid-course funnels.** Skip playlists that are trailers or teasers for paid batches. Skip "free demo lecture 1 of a paid course" series and playlists that are mostly ads.
6. **Quality bar for a playlist to count as a course:**
   - At least 6 real lectures (4 for exceptional short series such as 3Blue1Brown).
   - Covers a subject end to end, or a coherent unit of it.
   - Lectures are in order.
   - Not a random collection, Q&A dump, livestream archive, podcast, vlog, motivation series or "interview experience" list.
   - Prefer the newest edition of a course and the most complete playlist.
7. **Secrets.** Never commit `.env` or print secrets. The DB URL is in `.env` as `DB_URL`.
8. **Tooling.**
   - Use `bun`, never npm.
   - Work on `main`.
   - After each batch: run tests, commit, `git push`, then `bun run deploy`.
   - Another agent may be editing the same working tree, so stage only your own files.
9. **Docs sync (AGENTS.md §15).** When you add categories or providers, update the Courses entry in `src/lib/guide/entries/academics-and-marketplace.ts`: benefits, FAQ and keywords, and bump `updated`. Then run `bun run test src/lib/guide`.

---

## 3. Read these files first

| File | What it does |
|---|---|
| `.claude/skills/add-courses/SKILL.md` | The step-by-step how-to for this pipeline. Read it fully. |
| `scripts/courses/sources.ts` | **The list of channels.** You will mainly edit this. |
| `scripts/courses/import-youtube.ts` | Reads each channel's Playlists tab. It filters by `TOPICS` regexes, dedupes editions, checks every video, and writes `scripts/courses/data/youtube.json`. |
| `scripts/courses/youtube.ts` | YouTube reader: channel playlists, playlist videos, search, oEmbed status. No API key needed. |
| `scripts/courses/seed-youtube.ts` | Upserts the JSON into Postgres. It is idempotent and keeps learner progress. |
| `src/lib/courses/format.ts` | `COURSE_CATEGORIES`, the master list. Every category gets `/courses/category/<slug>`. |
| `src/lib/courses/recommend-signals.ts` | `FIELD_MAP` maps a student's branch or degree to categories for personalised feed picks. |
| `src/lib/courses/catalog-params.ts` | URL filters: `SOURCES`, `LANGUAGES`, `LEVELS`, `DURATIONS`. |
| `src/lib/courses/promotion.ts` | `SOURCE_BOOST` (ranking head start by source) and community promotion rules. |
| `src/db/schema/courses.ts` | Course tables. |

---

## 4. Research method: how to find great courses

Do this for **each category in §7**, then record your findings in a working table before touching code.

### 4.1 Find candidate channels
1. **Start from the candidate list in §8.** It is a starting point, not a verified list: handles may be wrong or channels may have changed.
2. **Search YouTube for full playlists.** Use the playlist filter: `https://www.youtube.com/results?search_query=<query>&sp=EgIQAw%253D%253D`. The helper `searchPlaylists(query)` in `scripts/courses/youtube.ts` does this. Query patterns:
   - `<subject> full course`, `<subject> complete playlist`, `<subject> lectures`
   - `<subject> one shot` (only if it is split into parts), `<subject> semester exam`, `<subject> GATE`
   - Hindi: `<subject> in hindi full course`, `<subject> hindi lectures complete`
   - University: `<subject> MIT OpenCourseWare`, `<subject> NPTEL`, `<subject> Yale open course`, `<subject> IIT lecture`
   - Syllabus-driven: take real syllabus units, for example AKTU, VTU, Mumbai University, Anna University, DU and IPU. Search unit names like `thermodynamics unit 1 lectures`.
3. **University and government catalogues:**
   - NPTEL: nptel.ac.in, browse by discipline. Every course links its YouTube playlist on `@iit` (nptelhrd) or `@nptel-nociitm`.
   - SWAYAM courses with YouTube lectures.
   - CEC (Consortium for Educational Communication): UGC undergraduate lectures for commerce, arts and science.
   - IIT Madras BS Degree: free public lectures for data science and electronic systems.
   - MIT OpenCourseWare: ocw.mit.edu, filter "Video lectures" by department.
   - Open Yale Courses on `@YaleCourses`.
   - Khan Academy playlists by subject.
4. **Signals of a reliable channel:**
   - Verified badge, real subscriber base, consistent uploads.
   - Comment sections full of students thanking the teacher.
   - An official website or LinkedIn that links to the channel.
   - Used by college students, for example recommended in r/Indian_Academia, r/developersIndia, r/JEENEETards (for science), r/medicalschoolindia or r/CAIndia.

### 4.2 Evaluate each candidate playlist
Score each one 1–5 on:
- **Completeness:** covers the syllabus or unit.
- **Teaching quality:** clear audio and visuals; the first 2 and the last lecture are coherent.
- **Recency:** prefer the last 5–6 years unless it is a timeless classic, such as MIT 18.06 or Walter Lewin's physics.
- **Embeddability.** Run `bun -e 'import {videoStatus} from "./scripts/courses/youtube.ts"; console.log(await videoStatus("<videoId>"))'`.
  - `embed` is ideal.
  - `external` (owner disabled embedding) is acceptable but worse UX.
  - `gone` means skip.
- **Level** (beginner, intermediate or advanced) and **language**.

Keep a playlist only if it scores 4 or more on completeness and quality.

### 4.3 Keep a research log
Before coding, create `scripts/courses/data/research-log.md` with one table per category:

`| Category | Channel | Handle | Official? (evidence) | Playlist title | Playlist ID | Videos | Language | Level | Score | Decision |`

This lets a reviewer audit every choice. Commit it.

---

## 5. Pipeline: how to add courses

### 5.1 Add or extend categories (only if missing)
1. Add the category to `COURSE_CATEGORIES` in `src/lib/courses/format.ts`. Most fields already exist; see §7.
2. Add or extend a regex in `TOPICS` in `scripts/courses/import-youtube.ts`.
   - **The first match wins**, so specific topics go before broad ones.
   - The current `TOPICS` list is computing-heavy. **You must add regexes for the non-computing categories**, otherwise their playlists are filtered out.
   - Example additions (tune them):
   ```ts
   { category: "Mechanical Engineering", re: /\b(thermodynamics|fluid mechanics|strength of materials|som\b|theory of machines|machine design|heat transfer|manufacturing|engineering mechanics|ic engines?|refrigeration)\b/i, tags: ["mechanical"] },
   { category: "Civil Engineering", re: /\b(structural analysis|surveying|geotechnical|soil mechanics|rcc|concrete|transportation engineering|hydrology|environmental engineering|estimation)\b/i, tags: ["civil"] },
   { category: "Electrical Engineering", re: /\b(electrical machines?|power systems?|control systems?|power electronics|network theory|circuit theory|electrical measurements?)\b/i, tags: ["electrical"] },
   { category: "Electronics & Communication", re: /\b(analog electronics|digital communication|signals and systems|vlsi|microprocessors?|microcontrollers?|embedded systems?|antenna|emft|electromagnetics)\b/i, tags: ["ece"] },
   { category: "Chemical Engineering", re: /\b(mass transfer|heat transfer operations|chemical reaction engineering|process control|unit operations|fluid flow)\b/i, tags: ["chemical"] },
   { category: "Medicine", re: /\b(anatomy|physiology|biochemistry|pathology|pharmacology|microbiology|medicine|surgery|neet ?pg|usmle|mbbs)\b/i, tags: ["medicine"] },
   { category: "Pharmacy", re: /\b(pharmaceutics|pharmacognosy|pharmaceutical|b\.? ?pharm|d\.? ?pharm|medicinal chemistry)\b/i, tags: ["pharmacy"] },
   { category: "Nursing & Allied Health", re: /\b(nursing|physiotherapy|paramedical|nclex)\b/i, tags: ["nursing"] },
   { category: "Finance & Accounting", re: /\b(accounting|accountancy|financial management|corporate finance|cost accounting|taxation|gst|income tax|auditing|ca foundation|ca inter|cfa|stock market|investing)\b/i, tags: ["finance"] },
   { category: "Economics", re: /\b(economics|microeconomics|macroeconomics|econometrics)\b/i, tags: ["economics"] },
   { category: "Marketing", re: /\b(marketing|digital marketing|seo|branding|advertising|social media marketing)\b/i, tags: ["marketing"] },
   { category: "Business", re: /\b(management|business studies|organi[sz]ational behaviou?r|hrm|human resource|operations management|supply chain|business law|mba)\b/i, tags: ["business"] },
   { category: "Entrepreneurship", re: /\b(startup school|entrepreneurship|startups?|founders?)\b/i, tags: ["startups"] },
   { category: "Law & Policy", re: /\b(constitution(al)? law|contract law|criminal law|ipc|bns|crpc|cpc|jurisprudence|family law|clat|llb|judiciary|legal)\b/i, tags: ["law"] },
   { category: "Psychology", re: /\b(psychology|cognitive|behaviou?ral science)\b/i, tags: ["psychology"] },
   { category: "Humanities", re: /\b(history|philosophy|literature|english literature|ethics)\b/i, tags: ["humanities"] },
   { category: "Social Sciences", re: /\b(sociology|political science|polity|geography|anthropology|public administration)\b/i, tags: ["social-sciences"] },
   { category: "Physics", re: /\b(physics|mechanics|electrodynamics|quantum|optics|thermal physics|modern physics)\b/i, tags: ["physics"] },
   { category: "Chemistry", re: /\b(chemistry|organic|inorganic|physical chemistry)\b/i, tags: ["chemistry"] },
   { category: "Biology", re: /\b(biology|cell biology|genetics|zoology|botany|ecology|molecular biology)\b/i, tags: ["biology"] },
   { category: "Design", re: /\b(ui ?\/? ?ux|ux design|graphic design|figma|typography|product design|illustrator|photoshop)\b/i, tags: ["design"] },
   { category: "Architecture", re: /\b(architecture|architectural|autocad|revit|sketchup)\b/i, tags: ["architecture"] },
   { category: "Media & Communication", re: /\b(journalism|filmmaking|video editing|premiere pro|public speaking|communication skills)\b/i, tags: ["media"] },
   { category: "Languages", re: /\b(english grammar|spoken english|ielts|toefl|german|french|japanese|spanish|korean)\b/i, tags: ["languages"] },
   { category: "Exam Prep", re: /\b(gate|upsc|ssc|cat\b|gmat|gre|ielts|clat|neet|bank po|ca foundation|ugc net|placement aptitude|aptitude)\b/i, tags: ["exam-prep"] },
   { category: "Career Skills", re: /\b(excel|power bi|resume|interview skills|aptitude|soft skills|productivity)\b/i, tags: ["career"] },
   ```
   - Watch for false positives. `mechanics` matches both physics and mechanical, so give a source an `include` regex or set its category explicitly. Use `--dry` to check.
   - If a category depends on the channel more than the title (e.g. Ninja Nerd is always Medicine), add an optional `category` field to `CourseSource` and use it in `importSource` before `classify()`.
3. Add the category to `FIELD_MAP` in `src/lib/courses/recommend-signals.ts`, so students in that branch see these courses in their feed.
4. Languages beyond English and Hindi:
   - Widen `language` in `CourseSource` (`"English" | "Hindi" | "Tamil" | "Telugu" | "Bengali" | "Marathi" | "Kannada" | "Malayalam" | "Gujarati"`).
   - Add the matching keys to `LANGUAGES` in `catalog-params.ts`.
   - Update the `lang` filter in `listCourses` (`src/lib/courses/server.ts`) to map keys to language names.

### 5.2 Add a channel
Add an entry to `SOURCES` in `scripts/courses/sources.ts`:
```ts
{ key: "ninjanerd", name: "Ninja Nerd", handle: "@NinjaNerdScience", kind: "CREATOR", language: "English",
  bio: "One factual sentence: who teaches, what, for whom.",
  include: /(Anatomy|Physiology|Pharmacology|Pathology|Biochemistry|Microbiology)/i, maxCourses: 12 },
```
- `kind: "UNIVERSITY"` is only for universities, government programmes (NPTEL, CEC, IIT Madras BS) and official course channels of research labs. Everyone else is `"CREATOR"`.
- Use `include` on big channels. Use `exclude` to drop junk (`/(shorts|live|podcast|batch|demo)/i`).
- `playlists: ["PL..."]` forces specific playlists in, bypassing filters.
- `maxCourses`: 8–25 depending on how much of the channel is real courses.
- `stripTitle` removes a noisy title prefix.

### 5.3 Preview, import, seed
1. Preview what would be picked (fast; it fetches no videos):
   ```bash
   bun scripts/courses/import-youtube.ts <key1>,<key2> --dry
   ```
   Read every line. Every one must be a real course in the right category. Iterate on `include`, `exclude` and `TOPICS` until clean.
2. Import (refreshes only those keys and keeps the rest of the data file):
   ```bash
   bun scripts/courses/import-youtube.ts <key1>,<key2>
   ```
3. Seed:
   ```bash
   bun --env-file=.env scripts/courses/seed-youtube.ts
   ```
   The seed re-applies all imported courses (about 10 minutes for 20k lectures). That is fine; it is idempotent.
4. Work in batches of about 5–10 channels per category, then commit.

---

## 6. Ranking (do not break)
- `SOURCE_BOOST` in `src/lib/courses/promotion.ts`: CS50 1.0, UNIVERSITY 0.9, CREATOR 0.4, COMMUNITY 0. The seed writes it to `courses.rank_boost`.
- The "popular" score is `rank_boost*4 + ln(1+enrolments) + trend*0.5 + ln(1+reviews)*0.5`.
- The "highest rated" sort uses a Bayesian prior of `3.5 + rank_boost*1.2`.
- Displayed stars are always real student ratings.
- If a creator is exceptional and widely trusted (for example NPTEL-level quality), propose a higher boost in your PR notes. **Do not change `SOURCE_BOOST` values on your own.**

---

## 7. Categories to cover, with research queries

For each category: find **8–15 courses**, including at least 3 university or government ones where they exist, plus English and Hindi options.

| Category (`COURSE_CATEGORIES`) | Subjects students search for | Example research queries |
|---|---|---|
| Electronics & Communication | analog/digital electronics, signals & systems, communication systems, VLSI, microprocessors, EMFT, control systems | `signals and systems full course`, `analog electronics nptel`, `microprocessor 8085 hindi` |
| Electrical Engineering | network theory, electrical machines, power systems, power electronics, measurements | `electrical machines complete playlist`, `power systems nptel`, `network theory gate` |
| Mechanical Engineering | thermodynamics, fluid mechanics, SOM, theory of machines, heat transfer, manufacturing, machine design, CAD | `thermodynamics full course hindi`, `fluid mechanics nptel`, `strength of materials lectures` |
| Civil Engineering | structural analysis, surveying, geotech, RCC design, transportation, environmental, estimation | `structural analysis full course`, `soil mechanics nptel`, `surveying hindi lectures` |
| Chemical Engineering | mass transfer, heat transfer, CRE, process control, thermodynamics | `LearnChemE playlist`, `chemical reaction engineering nptel` |
| Biotechnology | molecular biology, genetics, bioprocess, immunology | `molecular biology full course`, `biotechnology nptel` |
| Physics | mechanics, E&M, waves, modern physics, quantum, engineering physics | `MIT 8.01`, `engineering physics full course`, `quantum mechanics lectures` |
| Chemistry | organic, inorganic, physical, engineering chemistry | `organic chemistry full course`, `engineering chemistry hindi` |
| Biology | cell bio, genetics, ecology, physiology | `cell biology full course`, `MIT 7.012` |
| Mathematics | engineering maths (M1–M4), calculus, linear algebra, probability, numerical methods, discrete maths | `engineering mathematics 1 full course hindi`, `numerical methods nptel` |
| Medicine | anatomy, physiology, biochemistry, pathology, pharmacology, microbiology, clinical medicine | `anatomy full course`, `physiology lectures mbbs`, `pharmacology playlist` |
| Pharmacy | pharmaceutics, pharmacology, pharmacognosy, medicinal chemistry (B.Pharm/D.Pharm syllabus) | `b pharm 1st semester lectures`, `pharmaceutics hindi` |
| Nursing & Allied Health | anatomy for nursing, fundamentals of nursing, physiotherapy | `nursing fundamentals full course`, `bsc nursing lectures` |
| Business | principles of management, OB, HRM, operations, business law, strategy | `principles of management full course`, `organisational behaviour lectures` |
| Finance & Accounting | financial accounting, cost accounting, corporate finance, taxation, GST, auditing, investing | `financial accounting full course hindi`, `corporate finance course`, `income tax full course` |
| Economics | micro, macro, Indian economy, econometrics | `microeconomics full course`, `MIT 14.01`, `indian economy lectures` |
| Marketing | marketing management, digital marketing, SEO, branding | `digital marketing full course`, `marketing management lectures` |
| Entrepreneurship | startups, product, fundraising | `Y Combinator startup school playlist` |
| Law & Policy | constitutional, contract, criminal (IPC/BNS), jurisprudence, CLAT/judiciary | `constitutional law full course`, `contract law lectures`, `BNS lectures hindi` |
| Psychology | intro psych, cognitive, social, developmental | `introduction to psychology yale`, `crash course psychology` |
| Humanities | history, philosophy, literature, ethics | `history of india full course`, `justice michael sandel`, `english literature lectures` |
| Social Sciences | sociology, political science, geography, public administration | `sociology full course`, `political theory lectures` |
| Languages | English communication, IELTS, foreign languages | `spoken english full course`, `ielts full course`, `german a1 full course` |
| Design | UI/UX, graphic design, Figma, typography | `ui ux design full course`, `figma tutorial full course hindi` |
| Architecture | architectural design, AutoCAD, Revit, history of architecture | `autocad full course`, `revit architecture full course` |
| Media & Communication | journalism, filmmaking, editing, public speaking | `video editing full course`, `public speaking course` |
| Music & Arts | music theory, drawing | `music theory full course`, `drawing fundamentals course` |
| Exam Prep | GATE (all branches), CAT, UPSC, SSC, GRE, IELTS, CLAT, placement aptitude | `gate mechanical full course`, `cat quant full course`, `quantitative aptitude placement hindi` |
| Career Skills | Excel, Power BI, resume, interviews, communication | `excel full course hindi`, `power bi full course` |
| Personal Development | study skills, productivity | `how to study effectively playlist` |
| (existing computing categories) | Fill gaps: cybersecurity, cloud, DevOps, game dev, Android/Flutter | `ethical hacking full course hindi`, `aws full course` |

---

## 8. Candidate channels by field (verify every handle before use)

These are **leads**. Open each channel and confirm it is official and has structured playlists. If a handle is wrong, find the right one. Add good channels you discover that are not listed here.

**Universities and government (`kind: "UNIVERSITY"`)**
- NPTEL (`@iit`, already added for CS; add all other disciplines with a new source key and `include` per discipline).
- NPTEL-NOC IITM (`@nptel-nociitm`).
- IIT Madras BS Degree (`@IITMadrasBSDegreeProgramme`).
- CEC UGC (`@cecedusat`), undergraduate commerce, arts and science.
- MIT OpenCourseWare (`@mitocw`): add physics 8.01/8.02/8.03, chemistry 5.111, biology 7.012/7.016, economics 14.01/14.02, finance 15.401, mechanical 2.xx, civil 1.xx, chemical 10.xx, psychology 9.00.
- Open Yale Courses (`@YaleCourses`): psychology, philosophy, economics, history, organic chemistry, financial markets.
- Harvard University (`@harvard`): "Justice with Michael Sandel".
- Stanford (`@stanford`) and Stanford GSB, only full course series.
- Khan Academy (`@khanacademy`) and Khan Academy Medicine (`@khanacademymedicine`).
- Y Combinator (`@ycombinator`): Startup School.
- Google Career Certificates (`@GoogleCareerCertificates`).
- LearnChemE (`@LearnChemE`, University of Colorado Boulder).

**Engineering (`CREATOR`)**
- ALL ABOUT ELECTRONICS (`@ALLABOUTELECTRONICS`), Engineering Funda (`@EngineeringFunda`), Ekeeda (`@Ekeeda`).
- The Efficient Engineer (`@TheEfficientEngineer`), Lesics (`@Lesics`).
- Gate Academy, GATE Wallah by PW (`@GATEWallahbyPW`), Knowledge Gate (find the correct handle).
- Dr. Gajendra Purohit (`@DrGajendraPurohit`): engineering maths, Hindi.
- Neso Academy and Sudhakar Atchala (already added; extend to ECE/EEE playlists).

**Sciences and maths**
- Professor Dave Explains (`@ProfessorDaveExplains`), The Organic Chemistry Tutor (`@TheOrganicChemistryTutor`).
- Professor Leonard (`@ProfessorLeonard`), Dr. Trefor Bazett (`@DrTrefor`).
- Amoeba Sisters (`@AmoebaSisters`), Shomu's Biology (`@ShomusBiology`).
- CrashCourse (`@crashcourse`), Physics Galaxy (`@PhysicsGalaxyworld`).

**Medicine, pharmacy, nursing**
- Ninja Nerd (`@NinjaNerdScience`), Armando Hasudungan (`@ArmandoHasudungan`).
- Osmosis from Elsevier (`@osmosis`), MedCram (`@MEDCRAMvideos`), Dr. Najeeb Lectures (`@DrNajeebLectures`, free playlists only).
- Solution Pharmacy (`@SolutionPharmacy`), Carewell Pharma (`@CarewellPharma`).
- SimpleNursing (`@SimpleNursing`), RegisteredNurseRN (`@RegisteredNurseRN`).

**Commerce, finance, business, economics**
- CA Rachana Phadke Ranade (`@CArachanaranade`), Accounting Stuff (`@AccountingStuff`), Edspira (`@Edspira`).
- Marginal Revolution University (`@MarginalRevolutionUniversity`), Commerce Baba, Labour Law Advisor (`@LabourLawAdvisor`).
- Ahrefs (`@AhrefsCom`, SEO course), Google Career Certificates (digital marketing, project management).

**Law, humanities, social sciences, competitive exams**
- StudyIQ Education (`@StudyIQEducationLtd`), Drishti IAS (`@DrishtiIASvideos`). Use full subject series only, not daily current affairs.
- Law Wallah (verify), Unacademy Judiciary (verify; skip paid funnels).
- CrashCourse (philosophy, sociology, psychology, economics, history), Open Yale Courses.
- Rodha (`@Rodha`) and 2IIM CAT Preparation for CAT; Feel Free to Learn (`@FeelFreetoLearn`) for aptitude in Hindi.

**Design, architecture, media, languages, careers**
- The Futur (`@thefutur`), Flux Academy (`@FluxAcademy`), DesignCourse (`@DesignCourse`), Figma (`@Figma`), Saptarshi Prakash (`@SaptarshiPrakash`).
- 30X40 Design Workshop (`@30X40DESIGNWORKSHOP`).
- Film Riot (`@filmriot`).
- BBC Learning English (`@bbclearningenglish`).
- Leila Gharani (`@LeilaGharani`), Chandoo (`@chandoo_`).
- Thomas Frank (`@Thomasfrank`) for study skills.

**Regional-language engineering**
- Search Tamil, Telugu, Bengali, Marathi and Kannada full courses for core subjects (e.g. `thermodynamics tamil full course`).
- Add only clearly structured official channels.

---

## 9. Personalisation hooks (keep them working)
- The feed course slot is personalised by `src/lib/courses/recommend.ts` and `recommend-signals.ts`. Inputs:
  - Profile `branch` and `course` (degree), mapped through `FIELD_MAP`.
  - Profile interests.
  - Redis interest affinity.
  - Recent searches (`src/lib/search-history.ts`).
  - Recently viewed courses (`COURSE_VIEW` events) and enrolments.
- **When you add a category, add its degree and branch patterns to `FIELD_MAP`.** For example: `/\b(bpharm|d\.?pharm)\b/` maps to Pharmacy, and `/\b(b\.?sc nursing|gnm|anm)\b/` maps to Nursing & Allied Health.
- Tags matter. The seed copies `TOPICS[].tags` and `LANG_TAGS` onto courses, and the recommender matches search keywords against titles and tags. Give new topics meaningful tags such as `thermodynamics`, `anatomy` or `gst`.
- Add a unit test in `src/lib/courses/courses.test.ts` for each new `FIELD_MAP` entry, following the existing "maps degrees and branches" test.

---

## 10. Acceptance checks (run before every commit)

1. Preview is clean: `bun scripts/courses/import-youtube.ts <keys> --dry`. Every line is a real course in the right category.
2. Import logs show no channel skipped for errors. Any channel with more than 50% of its videos opening on YouTube is justified in the research log.
3. Tests and types pass:
   ```bash
   bun run test src/lib/courses src/lib/guide
   bun run typecheck
   ```
4. Database sanity:
   ```sql
   select category, count(*) from courses where status = 'PUBLISHED' and listed group by 1 order by 2 desc;
   select count(*) from courses c where status = 'PUBLISHED' and not exists (select 1 from course_lectures l where l.course_id = c.id); -- must be 0
   select slug from courses where slug ~ '-[0-9]+$' and id like 'crs_yt_%'; -- review collisions
   ```
5. Live smoke test after `bun run deploy`. All must return 200:
   - `/courses`
   - `/courses/category/<each new category slug>`
   - 3 random new course pages
   - 1 player page per new provider (`/learn/<slug>/<lectureId>`)
   - `/courses?lang=hindi`
   - `/api/courses?q=<subject>&limit=5`
6. Guide entry updated; `bun run test src/lib/guide` passes.
7. Commit in batches with clear messages, e.g. `feat(courses): add mechanical and civil engineering courses (NPTEL, Ekeeda, The Efficient Engineer)`. Push, then `bun run deploy`.

---

## 11. Deliverables
- Updated `scripts/courses/sources.ts`, `scripts/courses/import-youtube.ts` (`TOPICS`) and `src/lib/courses/format.ts` (if categories change).
- Updated `src/lib/courses/recommend-signals.ts` (`FIELD_MAP`) and `catalog-params.ts` (languages).
- `scripts/courses/data/youtube.json` (generated) and `scripts/courses/data/research-log.md` (your audit trail).
- New tests, the guide entry update, and a short summary listing courses added per category, per provider and per language, plus anything you skipped and why.
