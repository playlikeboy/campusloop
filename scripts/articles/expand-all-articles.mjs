/**
 * CampusLoop Articles Long-Form Expansion Engine
 *
 * Expands all published articles into comprehensive, authoritative, production-grade
 * collegiate and technical long-reads (4,500 to 7,500+ characters, 6-12 min read).
 *
 * Also sanitizes legacy demo tokens, sets is_demo = false, and recalculates reading_time_minutes.
 */

import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DB_URL or DATABASE_URL");
  process.exit(1);
}

const sql = neon(connectionString);

function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function calculateReadingTime(content) {
  const words = countWords(content);
  return Math.max(5, Math.ceil(words / 190));
}

// Category-specific rich expansions providing deep architectural breakdowns,
// edge case matrices, practical code/checklists, and collegiate context.
const EXPANSION_MODULES = {
  TECH_AND_PROGRAMMING: (title, currentContent) => `
${currentContent.trim()}

## Deep Technical Architecture & Systems Engineering Analysis

In enterprise software engineering and high-scale consumer infrastructure, raw syntax knowledge is secondary to understanding how code interacts with kernel scheduling, cache hierarchies, and network buffers. For engineering students transitioning from academic homework to production systems, several critical principles must guide your architecture:

### 1. Memory Layout and Cache Locality
Modern CPUs spend most of their cycles waiting on memory bus latencies. Whether writing Go, Rust, C++, or Node.js native addons:
- **Array of Structures (AoS) vs. Structure of Arrays (SoA)**: When scanning millions of items, contiguous memory layout allows hardware prefetchers to load L1/L2 data cache lines efficiently without pipeline stalls.
- **Allocation Pressure & Escape Analysis**: In managed runtimes, allocating objects inside tight loops triggers garbage collection stop-the-world pauses. Prefer reusing buffers and allocating on the stack whenever lifetime permits.

\`\`\`rust
// Zero-copy deserialization pattern example
pub struct FrameHeader<'a> {
    pub magic: u16,
    pub payload_len: u32,
    pub payload: &'a [u8], // Borrows directly from socket buffer without allocation
}

impl<'a> FrameHeader<'a> {
    pub fn parse(buf: &'a [u8]) -> Result<Self, &'static str> {
        if buf.len() < 6 { return Err("Buffer too short"); }
        let magic = u16::from_be_bytes([buf[0], buf[1]]);
        let payload_len = u32::from_be_bytes([buf[2], buf[3], buf[4], buf[5]]);
        Ok(Self { magic, payload_len, payload: &buf[6..6 + payload_len as usize] })
    }
}
\`\`\`

### 2. Concurrency Primitives and Lock Contention
- Avoid coarse-grained mutex locks around I/O operations. A held lock during a disk or network read instantly serializes high-throughput thread pools.
- Prefer lock-free ring buffers (like LMAX Disruptor patterns) or channel-based actor models for decoupled producer-consumer pipelines.
- Be aware of false sharing: two independent atomic variables on the same 64-byte cache line will cause CPU cores to continuously invalidate each other's cache states.

### 3. Edge Cases, Pitfalls & Critical Anti-Patterns to Avoid
1. **Unbounded Queues in Asynchronous Workers**: An unbounded queue under spike traffic causes memory exhaustion (OOM crashes) before backpressure can signal upstream callers to throttle. Always configure high-water marks and explicit drop or retry policies.
2. **Ignoring Tail Latency (p99 and p99.9)**: Average latency is a deceptive metric. In a microservice mesh with 20 downstream fan-out requests, a single p99 outlier makes over 18% of user-facing transactions visibly sluggish.
3. **Silent Error Swallowing**: Catching generic exceptions without structured telemetry creates black-box failures during production outages.

---

## 4-Week Collegiate Mastery Roadmap

- **Week 1: Foundations**: Implement a custom memory allocator (free-list or bump allocator) in C, Zig, or Rust to internalize pointer arithmetic and alignment constraints.
- **Week 2: Networking**: Build a minimal TCP echo server using non-blocking \`epoll\` (Linux) or \`kqueue\` (macOS) to see how modern event loops function under the hood.
- **Week 3: Profiling**: Instrument an existing project using \`perf\`, \`valgrind\`, or flame graphs to identify instruction cache misses and flame-graph hotspots.
- **Week 4: Benchmarking**: Write reproducible micro-benchmarks with statistical variance reporting to verify optimization hypotheses before merging.

### Curated Resources & Official Documentation
- [Systems Performance: Enterprise and the Cloud (Brendan Gregg)](https://www.brendangregg.com/systems-performance-2nd-edition-book.html)
- [The Rust Performance Book](https://nnethercote.github.io/perf-book/)
- [Computer Systems: A Programmer's Perspective (CS:APP)](https://csapp.cs.cmu.edu/)
`,

  AI_AND_ML: (title, currentContent) => `
${currentContent.trim()}

## Deep Mathematical Foundations & Hardware Acceleration Dynamics

Modern applied machine learning in collegiate research has moved beyond copying Kaggle notebooks. To stand out for research labs and high-tier industry ML roles, students must understand the convergence of matrix arithmetic, quantization loss, and distributed inference topologies.

### 1. The Geometry of Transformer Attention & KV Cache Scaling
The core computational bottleneck of autoregressive inference is the key-value (KV) cache. During generation, storing previous token activations grows linearly with context length:
- **Memory Footprint**: For an 8B parameter model in FP16, each token in context consumes \`2 * 2 * layers * kv_heads * head_dim\` bytes. At 8k tokens, the KV cache alone demands gigabytes of precious VRAM.
- **PagedAttention and vLLM**: Similar to virtual memory paging in OS kernels, modern serving engines chunk the KV cache into fixed pages, eliminating internal memory fragmentation and boosting throughput by 3x–5x.

\`\`\`python
# Quantized inference with FlashAttention-2 and 4-bit weights
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Meta-Llama-3.1-8B-Instruct",
    quantization_config=quantization_config,
    device_map="auto",
    attn_implementation="flash_attention_2"
)
print("Quantized model loaded into consumer GPU VRAM successfully.")
\`\`\`

### 2. Loss Formulations, Overfitting, and Data Contamination
- **Catastrophic Forgetting**: Fine-tuning an aligned model on narrow datasets frequently damages its general reasoning capability. Mitigate this by blending 10%–15% high-quality generalist reasoning traces into your domain corpus.
- **Data Deduplication**: Near-duplicate sentences in training sets lead models to memorize verbatim text rather than learning latent reasoning structures. Use MinHash or embedding cosine clusters to scrub raw scrapings.
- **Evaluation Leakage**: Never evaluate on benchmarks whose questions might have appeared in web scrapes used during base model pretraining.

### 3. Practical Research Project Blueprint for College Students
1. **Define a Non-Trivial Benchmark**: Choose a specific Indian domain—such as regional legal terminology, vernacular university exams, or localized civic bylaws—where standard global frontier models struggle.
2. **Curate Synthetic Chains of Thought**: Generate 1,500 diverse multi-turn reasoning steps verified by domain rules.
3. **Execute LoRA Rank Experiments**: Compare Rank 8 vs Rank 64 adapters across training loss curves and human evaluation samples.
4. **Publish Open Weights & Evaluation Harness**: Host your LoRA weights on Hugging Face Hub with an explicit evaluation script and reproducible seed settings.

### Recommended References & Tooling
- [Hugging Face PEFT & TRL Documentation](https://huggingface.co/docs/trl)
- [Tim Dettmers: QLoRA Efficient Finetuning Paper](https://arxiv.org/abs/2305.14314)
- [DeepLearning.AI: Fine-Tuning Large Language Models](https://www.deeplearning.ai/)
`,

  WEB_DEVELOPMENT: (title, currentContent) => `
${currentContent.trim()}

## Production Web Architecture: Edge Runtimes, Streaming & Zero-Jank Rendering

Building web software for hundreds of thousands of concurrent college students demands moving beyond simple monolithic express servers running on fragile local instances. Production engineering requires understanding cache boundaries, hydration overhead, and edge computing topologies.

### 1. Server Components vs. Client Hydration Cost
Every kilobyte of JavaScript shipped to the client browser incurs a parse, compile, and execute cost that disproportionately penalizes budget Android phones common on campus Wi-Fi networks:
- **Server Components by Default**: Render layout scaffolding, markdown, and static cards strictly on edge workers. Zero JavaScript bytes for these elements travel over the wire.
- **Selective Hydration**: Isolate interactivity (such as voting buttons or comment modals) into compact leaf nodes.
- **Streaming SSR with Suspense**: Stream the critical navigation shell immediately within 30ms, while streaming slow database queries asynchronously as HTML chunks arrive.

\`\`\`tsx
// Edge streaming pattern in Next.js App Router
import { Suspense } from "react";

export default function CampusTimelinePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Instant Shell */}
      <h1 className="text-2xl font-bold tracking-tight">Campus Activity Stream</h1>
      
      {/* Asynchronous Edge Streaming */}
      <Suspense fallback={<TimelineSkeleton count={5} />}>
        <AsyncTimelineFeed />
      </Suspense>
    </div>
  );
}
\`\`\`

### 2. Database Connection Pooling at the Edge
Cloudflare Workers and serverless platforms spawn hundreds of isolated V8 isolates simultaneously. If each isolate opens a stateful TCP connection to PostgreSQL, the database server's connection pool saturates instantly:
- **HTTP / WebSocket Connection Pooling**: Always route queries through serverless poolers (such as Neon's WebSocket pooler or PgBouncer).
- **Prepared Statement Caching**: Understand that distributed edge workers do not share in-memory prepared statement caches across global points of presence. Keep database drivers lightweight and query structures predictable.

### 3. Performance Checklist for College Hackathons & Production Sites
- [ ] Core Web Vitals: Largest Contentful Paint (LCP) under 1.8s on 4G networks.
- [ ] Cumulative Layout Shift (CLS) strictly below 0.05 by reserving aspect ratio boxes for images and embedded media.
- [ ] First Input Delay (FID) / Interaction to Next Paint (INP) below 100ms.
- [ ] HTTP Security Headers: Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), and X-Content-Type-Options: nosniff.

### Curated Resources & Official Guides
- [Web.dev: Optimizing Interaction to Next Paint (INP)](https://web.dev/articles/optimize-inp)
- [Cloudflare Workers Architecture & Runtime Docs](https://developers.cloudflare.com/workers/runtime-apis/)
- [Next.js App Router Deep Dive](https://nextjs.org/docs/app)
`,

  DSA: (title, currentContent) => `
${currentContent.trim()}

## Deep Algorithmic Patterns & Technical Interview Mastery

Grinding hundreds of random LeetCode problems without a mental classification taxonomy leads to interview anxiety and pattern blindness. Technical recruitment rounds at top-tier product engineering firms evaluate your capacity to map unfamiliar business requirements onto canonical algorithmic invariants.

### 1. The Unified Pattern Matrix

| Pattern Family | Canonical Invariant | Time Complexity | Typical Problem Indicators |
|---|---|---|---|
| **Two Pointers / Sliding Window** | Monotonic constraint on subarray boundaries | O(N) | Contiguous subarrays, target sums, longest substring |
| **Monotonic Stack / Queue** | Maintains elements in strictly increasing/decreasing order | O(N) | Next greater element, histogram largest rectangle, stock span |
| **Fast & Slow Pointers** | Cycle detection and midpoint identification | O(N) space O(1) | Linked list cycles, duplicate number in read-only array |
| **Topological Sort** | Resolving dependency DAGs | O(V + E) | Course schedules, build ordering, task prerequisites |
| **Union-Find (DSU)** | Dynamic connectivity with path compression & rank | O(α(N)) ≈ O(1) | Connected components, minimum spanning trees (Kruskal) |

\`\`\`python
# Clean Monotonic Stack Implementation for Next Greater Element
def next_greater_elements(nums: list[int]) -> list[int]:
    n = len(nums)
    res = [-1] * n
    stack = []  # Stores indices of elements waiting for a greater element
    
    for i in range(n):
        while stack and nums[stack[-1]] < nums[i]:
            idx = stack.pop()
            res[idx] = nums[i]
        stack.append(i)
        
    return res
\`\`\`

### 2. Time & Space Complexity Tradeoffs Under Pressure
- **Amortized Analysis**: In a monotonic stack, although there is a nested \`while\` loop, every element is pushed exactly once and popped at most once. Hence, the aggregate complexity across the entire iteration is strictly O(N), not O(N²).
- **In-Place Modifications vs. Immutability**: While interviewers appreciate O(1) auxiliary space solutions that modify input arrays in-place (such as Cycle Sort), always ask if the input data structure is read-only or shared across concurrent threads.

### 3. The 4-Step Communication Framework During Live Whiteboarding
1. **Clarify Constraints First**: Verify integer ranges (can inputs overflow 32-bit signed integers?), empty arrays, duplicate values, and memory limitations.
2. **State the Naive Brute Force**: Articulate the O(N²) or O(2^N) baseline in 60 seconds to establish a foundation, then explain why the bottleneck exists.
3. **Propose the Optimal Invariant**: Explain *why* your chosen data structure eliminates redundant computations.
4. **Trace Edge Cases Before Writing Code**: Walk through \`[]\`, \`[1]\`, and sorted reverse arrays using explicit test variables.

### Recommended Practice Resources
- [NeetCode 150 Pattern Roadmap](https://neetcode.io/roadmap)
- [CP-Algorithms: Algorithms and Data Structures](https://cp-algorithms.com/)
- [Steven Skiena: The Algorithm Design Manual](https://www.algorist.com/)
`,

  CYBERSECURITY: (title, currentContent) => `
${currentContent.trim()}

## Threat Modeling, Defensive Engineering & Collegiate CTF Methodology

Cybersecurity in 2026 is fundamentally about defensive architecture and reducing attack surface. Whether defending university portals or competing in national collegiate Capture The Flag (CTF) tournaments, a rigorous methodology distinguishes amateur script-kiddies from professional security engineers.

### 1. Modern Web & Network Vulnerability Vectors
- **Broken Object Level Authorization (BOLA / IDOR)**: The most prevalent vulnerability in student APIs. An endpoint like \`/api/orders/:id\` that verifies user authentication but fails to verify that the requesting user actually owns resource \`:id\`.
- **Server-Side Request Forgery (SSRF)**: Allowing user-supplied URLs in webhook testing or preview card generation. Without strict egress IP filtering, an attacker can pivot to reach cloud metadata endpoints (\`http://169.254.169.254\`) and extract temporary IAM credentials.
- **JWT Misconfigurations**: Using the insecure \`none\` algorithm, weak symmetric secrets susceptible to GPU dictionary attacks via \`hashcat\`, or failing to validate token expiration and revocation lists.

\`\`\`python
# Example of secure SSRF-safe URL validation
import ipaddress
import socket
from urllib.parse import urlparse

def is_safe_egress_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False
    hostname = parsed.hostname
    if not hostname:
        return False
    try:
        # Resolve all IP addresses for the hostname
        ip_list = socket.getaddrinfo(hostname, None)
        for entry in ip_list:
            ip_str = entry[4][0]
            ip = ipaddress.ip_address(ip_str)
            # Block private, loopback, link-local, and reserved ranges
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
        return True
    except socket.gaierror:
        return False
\`\`\`

### 2. Hardening Student Infrastructure: A Practical Checklist
- [ ] Enforce Multi-Factor Authentication (MFA) via FIDO2 WebAuthn or hardware security keys over vulnerable SMS OTPs.
- [ ] Store passwords exclusively using modern memory-hard key derivation functions: Argon2id (preferred) or bcrypt with cost factor >= 12.
- [ ] Implement strict Content Security Policy (CSP) headers without \`unsafe-inline\` to neutralize Stored Cross-Site Scripting (XSS).
- [ ] Never commit secrets, \`.env\` files, or private keys to Git. Utilize pre-commit hooks with \`gitleaks\` or \`trufflehog\`.

### Curated Practice Platforms & Guides
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [OverTheWire Wargames: Bandit & Natas](https://overthewire.org/wargames/)
- [OWASP Top 10 API Security Risks](https://owasp.org/www-project-api-security/)
`,

  TRAVEL: (title, currentContent) => `
${currentContent.trim()}

## Strategic Collegiate Transit, IRCTC Logistics & High-Value Exploration

Student travel across India offers unmatched cultural education and lifelong camaraderie, but poorly planned logistics quickly derail semester budgets. Navigating Indian Railways algorithms, state transport networks, and offbeat regional circuits requires insider methodology.

### 1. Mastering Indian Railways & IRCTC Booking Algorithms
- **The RAC and Waiting List Hierarchy**: Understand the priority difference between General Waiting List (GNWL), Remote Location Waiting List (RLWL), and Pooled Quota Waiting List (PQWL). GNWL tickets confirm at nearly triple the frequency of RLWL or PQWL tickets due to centralized quota allocations.
- **Tatkal Strategy**: Log into IRCTC exactly 3 minutes prior to opening (10:00 AM for AC, 11:00 AM for Non-AC). Prefill passenger master lists in your profile, use UPI QR payment methods (which generate 2-second confirmation calls without bank SMS delays), and have an alternate station along the train route ready.
- **Student Concessions & Verification**: Always carry your physical, verified college photo ID card alongside your Aadhaar. Many state transport corporations (like KSRTC, MSRTC, and HRTC) offer semester or holiday concessions when verified through college administration stamps.

### 2. Budget Itinerary Framework: Under ₹3,500 All-Inclusive Weekend Circuits

#### Northern Hubs (Delhi NCR, Chandigarh, Jaipur)
- **Tirthan Valley & Jibhi (Himachal)**: Skip commercialized Manali traffic. Take an overnight HRTC Volvo to Aut Tunnel, transfer to a local bus to Banjar/Jibhi. Homestays run ₹500–₹800/night split between peers. Trek through Great Himalayan National Park trails with zero commercial entry fees.
- **Chakrata & Tiger Falls (Uttarakhand)**: Clean pine forests, secluded waterfalls, and zero commercial tourist congestion within 7 hours of Delhi.

#### Southern Hubs (Bengaluru, Chennai, Hyderabad)
- **Gokarna & Honnavar (Karnataka)**: Take the overnight Panchaganga Superfast Express to Kumta/Gokarna Road. Stay in budget beach shacks on Kudle or Om Beach. Combine with a scenic backwater boat ride in Honnavar.
- **Wayanad & Chembra Peak (Kerala)**: KSRTC buses from Shantinagar bus stand provide smooth overnight transit into the Western Ghats.

### 3. Essential Packing & Safety Protocol for Students
1. **Power & Connectivity**: A 20,000mAh Power Delivery (PD) power bank is mandatory. Download offline maps via Google Maps or OsmAnd before leaving network zones.
2. **Health & Food Safety**: Never consume uncovered water or raw cut salads at train platforms. Stick to freshly cooked hot foods, bananas, or boiled eggs. Carry an emergency kit with ORS sachets, paracetamol, and band-aids.
3. **Emergency Numbers & Safety Circles**: Share your live tracking location with a trusted peer group or hostel warden before venturing into backcountry trails.
`,

  ACADEMICS: (title, currentContent) => `
${currentContent.trim()}

## Cognitive Science of High-Retention Study Systems & CGPA Engineering

Securing a high Cumulative Grade Point Average (CGPA) in Indian university systems does not require 14-hour daily grinds or toxic sleeplessness. Top academic performers apply empirical cognitive psychology: active recall, spaced intervals, and strategic exam script engineering.

### 1. Evidence-Based Study Architectures

\`\`\`
[Raw Lecture / Textbook] 
        │
        ▼ (Within 24 Hours)
[Feynman Synthesis & Anki Flashcards] 
        │
        ▼ (Day 3 & Day 7)
[Spaced Active Retrieval Testing]
        │
        ▼ (Pre-Exam Week)
[Simulated Exam Conditions with PYQs]
\`\`\`

- **The Forgetting Curve & The 24-Hour Review Window**: Over 70% of new engineering concepts decay within 24 hours if not actively retrieved. A focused 15-minute review session the evening of the lecture seals short-term memory traces into long-term hippocampal storage.
- **The Feynman Technique**: You do not truly understand a thermodynamic cycle, operating system page replacement algorithm, or calculus theorem until you can explain it in simple language to a first-year student without glancing at lecture slides.
- **Spaced Retrieval with Anki**: Convert dense definitions, chemical mechanisms, and mathematical proofs into question-and-answer flashcard decks. Study 20 minutes daily on your phone while commuting or between classes.

### 2. Engineering the University Exam Answer Script
Indian university evaluators grade hundreds of physical answer booklets every day under strict time pressure. Optimize your script for effortless evaluator comprehension:
1. **Lead with Structural Diagrams**: Evaluators look for architecture diagrams, flowcharts, or block schematics before reading paragraphs. Draw clear, labeled diagrams in the upper half of your response.
2. **Point-Wise Formatting with Bold Keywords**: Underline or box governing equations, assumptions, and final answers with units clearly marked.
3. **Step-Marking Hygiene in Numerical Problems**: Always explicitly state: \`Given Data\`, \`Governing Formula\`, \`Step-by-step Substitution\`, and \`Final Value with Metric Units\`. Even if arithmetic errors occur, step marking guarantees 80%+ credit.

### 3. The 3-Week Exam Preparation Checklist
- [ ] **T-21 Days**: Aggregate all Previous Year Questions (PYQs) from the last 5 years. Identify topics that appear consistently (the 20% syllabus that drives 80% of exam marks).
- [ ] **T-14 Days**: Complete all high-frequency derivations and core theoretical definitions. Create formula reference sheets.
- [ ] **T-7 Days**: Solve at least two full previous papers under strict 3-hour timed exam conditions with all devices turned off.
- [ ] **T-1 Day**: Zero new topics. Review high-yield formula sheets, ensure 8 hours of restorative sleep, and prepare your stationary and university admit card.
`,

  CAREER_ADVICE: (title, currentContent) => `
${currentContent.trim()}

## Engineering Career Architecture: Portfolios, Networking & Tech Hiring Reality

Transitioning from an undergraduate engineering degree into high-impact software engineering or product roles requires understanding how hiring committees actually evaluate candidates. A generic resume with academic coursework and cloned tutorial projects will not pass modern screening filters.

### 1. Building the Proof-of-Work Portfolio That Stand Out
Recruiters and hiring managers spend an average of 30 seconds skimming a candidate's portfolio. What commands attention:
- **Production-Grade Deployed Systems**: A live web application with a custom domain, SSL certificate, responsive mobile design, and real users beats 10 local GitHub repositories with broken READMEs.
- **Systems Depth Over Superficial Breadth**: One deeply engineered project—such as a distributed key-value store, a custom WebRTC video conferencing engine, or a database query optimizer—demonstrates vastly higher technical maturity than five cloned To-Do apps.
- **Technical Writing & Documentation**: A comprehensive, well-structured README documenting architectural tradeoffs, benchmark graphs, and local setup commands proves you can communicate like a staff engineer.

### 2. The High-Conversion Single-Page Resume Blueprint
- **Strictly One Page**: Unless you have 10+ years of industry experience, keep your resume strictly to a single page. Use clean LaTeX templates (like Jake's Resume) with zero graphics or multi-column parsing traps that confuse ATS scanners.
- **The Google XYZ Formula for Bullet Points**: Every bullet point must demonstrate impact:
  * *Weak*: "Worked on backend API using Node.js and MongoDB."
  * *Strong*: "Architected asynchronous webhook processing pipeline using Node.js and Redis, reducing p99 ingestion latency by 42% across 150,000 daily events."
- **Skills Section Hygiene**: Group technical skills logically (\`Languages\`, \`Frameworks\`, \`Cloud & Infrastructure\`, \`Databases\`). Never include self-assessed star ratings (e.g. "Python: 4/5 stars").

### 3. Strategic Outbound Networking & Cold Outreach
1. **Never Ask for a Referral in the First Message**: Connect with engineering leads by asking specific, insightful questions about technical blog posts they wrote or architectural decisions in their company's engineering blog.
2. **Deliver Upfront Value**: If applying to a startup, audit their landing page performance, identify an unhandled API edge case, or propose a clean UI refinement. Proof of competence gets interviews instantly.
`,

  STARTUPS: (title, currentContent) => `
${currentContent.trim()}

## Dorm-Room Venture Architecture: Validation, Unit Economics & Early Traction

Launching a startup while managing engineering coursework is an exhilarating crucible. However, 90% of student startups fail not from engineering incompetence, but from building solutions to problems nobody actually cares enough to pay for.

### 1. The Idea Validation Framework: The Mom Test Protocol
- **Never Ask "Would You Use This?"**: People will always politely say yes to avoid hurting your feelings.
- **Investigate Past Behavior**: Ask prospective customers: "How did you solve this problem last week? How much time or money did you spend trying to fix it? What did you hate about existing tools?"
- **The Pre-Sale Benchmark**: Before writing a single line of backend code, collect 10 pre-orders, letters of intent (LOIs), or upfront deposits. If you cannot sell the concept with a Figma prototype, building the software will not solve the demand problem.

### 2. Zero-Cost Infrastructure & Rapid Prototyping Stack
Do not burn early capital on expensive cloud compute before reaching product-market fit:
- **Hosting & Compute**: Cloudflare Workers, Vercel, and GitHub Pages free tiers provide enterprise-grade edge global CDNs for $0/month.
- **Database & State**: Neon serverless Postgres, Supabase, and Upstash Redis offer generous free developer tiers capable of handling tens of thousands of active users.
- **Authentication & Security**: Hexclave, Clerk, or Supabase Auth handle OAuth, session management, and verification out of the box with zero security maintenance overhead.

### 3. Legal, IP & Campus Administration Considerations
1. **University Intellectual Property (IP) Policies**: Inspect your college handbook regarding work created on campus lab computers or under university Wi-Fi. Ensure your startup IP remains strictly under personal ownership.
2. **Founder Vesting Agreements**: Never split equity 50/50 without a standard 4-year vesting schedule and a 1-year cliff. If a co-founder drops out after semester exams, unvested equity must return to the company pool.
`,

  FINANCE: (title, currentContent) => `
${currentContent.trim()}

## Student Financial Engineering: Budgeting, Credit Literacy & Long-Term Compounding

Financial independence begins with the first rupee managed during collegiate life. Avoiding consumer debt traps, building an emergency buffer, and understanding the mathematics of compound interest during your early twenties creates life-altering career leverage upon graduation.

### 1. The Hostel Budgeting Formula: 50/30/20 Adapted for Students

\`\`\`
[Monthly Allowance / Stipend]
       ├── 50% Core Necessities (Mess dues, transit, medicine, essential stationery)
       ├── 30% Lifestyle & Social (Weekend outings, campus canteen, books, hobbies)
       └── 20% Wealth Buffer (Emergency reserve, index fund SIPs, tech fund)
\`\`\`

- **The Micro-Expense Bleed**: Spending ₹80 daily on chai, packaged snacks, and food deliveries accumulates to over ₹2,400 monthly—often 30% of a hostel student's entire allowance. Track every transaction using a simple spreadsheet or privacy-preserving expense tracker.
- **Building a ₹10,000 Emergency Shield**: Before investing in stocks or crypto, accumulate a liquid cash buffer in a high-interest savings account. This shields you from unexpected hostel repair charges, emergency transit, or broken hardware without begging for loans.

### 2. Credit Cards, BNPL & The Predatory Debt Trap
- **The Danger of Buy-Now-Pay-Later (BNPL) Apps**: Student-targeted micro-loan apps carry effective annualized interest rates of 36%–48% with aggressive collection penalties. Avoid them entirely.
- **Building a Clean CIBIL Score Responsibly**: If eligible, secure a secured credit card backed by a small fixed deposit (FD). Use it strictly for recurring utility bills and pay the balance in full 5 days before the due date. This builds a 750+ credit score before graduation.

### 3. The Power of Early Compounding in Low-Cost Index Funds
- Investing just ₹1,000 monthly in a broad-market Nifty 50 index fund at an average historical CAGR of 12% compounds into over ₹10,00,000 in 20 years. Starting at age 19 instead of age 27 yields triple the terminal wealth due to the exponential tail of compounding.
`,

  DEFAULT: (title, currentContent) => `
${currentContent.trim()}

## In-Depth Analysis, Best Practices & Practical Implementation Guidelines

To provide students and practitioners with a complete, actionable understanding of this topic, this section synthesizes core conceptual frameworks, operational best practices, and actionable workflows tested across Indian campuses and technology ecosystems.

### 1. Fundamental Principles & Systems Perspective
Regardless of whether you are navigating collegiate academics, personal projects, or campus community initiatives, sustainable success requires:
- **Clear Goal Decomposition**: Break large, intimidating objectives (such as mastering a new subject or organizing a campus fest) into small, measurable milestones with explicit completion criteria.
- **Feedback Loops Over Assumptions**: Test hypotheses early. Gather honest feedback from peers, mentors, and end-users before investing weeks of effort into unverified assumptions.
- **Documentation & Continuity**: Maintain structured notes and project retrospectives. Institutional knowledge shared publicly elevates the entire campus community.

### 2. Practical Step-by-Step Action Plan
1. **Initial Assessment (Days 1–3)**: Audit your current baseline, identify constraints, and remove friction points in your environment.
2. **Prototyping & Execution (Weeks 1–2)**: Implement the core workflow with minimal overhead. Focus strictly on consistency over perfection.
3. **Review & Refinement (Week 3+)**: Measure outcomes against your baseline. Eliminate inefficiencies and formalize your habits.

### 3. Common Pitfalls & Antipatterns
- **Premature Optimization**: Spending days configuring tools and productivity apps instead of doing the actual creative or technical work.
- **Isolation**: Trying to solve complex challenges entirely alone without tapping into the collective intelligence of college peers and student networks.
- **Inconsistency**: Intense bursts of effort followed by prolonged inactivity. Small daily actions consistently outperform sporadic all-nighters.

### Curated Resources for Further Exploration
- [CampusLoop Student Knowledge Hub](https://campusloop.space/articles)
- [Open Source Collegiate Resources & Guides](https://github.com/SH20RAJ/campusloop)
`
};

async function main() {
  console.log("Starting CampusLoop Article Long-Form Expansion Engine...\n");

  const articles = await sql`
    SELECT
      a.id,
      a.slug,
      a.title,
      a.content,
      a.category,
      a.reading_time_minutes,
      u.username,
      u.display_name
    FROM articles a
    JOIN user_profiles u ON a.author_id = u.id
    WHERE a.status = 'PUBLISHED'
    ORDER BY a.created_at ASC;
  `;

  console.log(`Found ${articles.length} published articles to inspect and expand.\n`);

  let expandedCount = 0;

  for (const art of articles) {
    const currentLen = art.content.length;

    // Expand articles that are shorter than 4,200 characters
    if (currentLen < 4200) {
      const categoryKey = art.category.toUpperCase().replace(/-/g, "_");
      const expandFn = EXPANSION_MODULES[categoryKey] || EXPANSION_MODULES.DEFAULT;

      let expandedContent = expandFn(art.title, art.content);

      // Clean up any stale legacy demo tokens in the content
      expandedContent = expandedContent
        .replace(/\(@demo_[a-z0-9_]+\)/gi, `(@${art.username})`)
        .replace(/demo_[a-z0-9_]+/gi, art.username)
        .replace(/Aarav Sharma \(@demo_tech\)/gi, `${art.display_name} (@${art.username})`);

      const newReadingTime = calculateReadingTime(expandedContent);

      await sql`
        UPDATE articles
        SET
          content = ${expandedContent},
          reading_time_minutes = ${newReadingTime},
          is_demo = false,
          updated_at = NOW()
        WHERE id = ${art.id};
      `;

      expandedCount++;
      console.log(`[EXPANDED] ${art.slug} (${currentLen} -> ${expandedContent.length} chars, ~${newReadingTime} min read)`);
    } else {
      // Ensure is_demo = false and reading_time is updated even if already long
      const currentReadingTime = calculateReadingTime(art.content);
      await sql`
        UPDATE articles
        SET
          is_demo = false,
          reading_time_minutes = ${currentReadingTime},
          updated_at = NOW()
        WHERE id = ${art.id};
      `;
      console.log(`[VERIFIED] ${art.slug} (already comprehensive: ${currentLen} chars, ${currentReadingTime} min read)`);
    }
  }

  console.log(`\nSuccessfully processed all ${articles.length} articles! (Expanded: ${expandedCount})`);

  // Verify post-expansion statistics
  const stats = await sql`
    SELECT
      count(*) as total_articles,
      min(length(content)) as min_length,
      avg(length(content))::int as avg_length,
      max(length(content)) as max_length,
      avg(reading_time_minutes)::int as avg_read_time
    FROM articles
    WHERE status = 'PUBLISHED';
  `;

  console.log("\nPost-Expansion Articles Matrix:");
  console.table(stats);
}

main().catch((err) => {
  console.error("Expansion engine failed:", err);
  process.exit(1);
});
