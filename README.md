# Startup Intel — AI Startup Intelligence Agent

An AI-powered startup idea validator that delivers **VC-grade due diligence**, a complete **execution playbook**, and a **ready-to-use sample landing page** — all from a single prompt.

---

## What It Does

Paste any startup idea and the agent runs a **3-step chain-of-thought analysis** powered by a large language model:

| Step | What Happens | Output |
|------|-------------|--------|
| **1 — Research & Due Diligence** | Deep market research, competitive mapping, 5-lens critical analysis with calibration check | Score (0–10), Verdict (Build / Pivot / Drop), confidence rating, TAM/SAM/SOM, competitor weaknesses, buyer persona |
| **2 — Execution Planning** | MVP architecture, monetization model, go-to-market strategy, landing page copywriting, pitch deck summary | Tech stack, user flow, pricing tiers, unit economics, first-100-users plan, structured pitch |
| **3 — Sample Landing Page** | Generates a complete, production-quality HTML landing page (only for Build/Pivot verdicts) | Self-contained HTML with responsive design, hero section, features, social proof, CTA |

Results stream in real-time with a multi-step progress indicator.

---

## Features

### Input
- **Text Input** — Describe your startup idea in up to 5,000 characters
- **File Upload** — Upload a PDF or DOCX pitch deck for automatic text extraction (PDF processed via LLM vision, DOCX parsed via mammoth)
- **Keyboard Shortcut** — Press `Ctrl+Enter` (or `⌘+Enter` on Mac) to submit instantly
- **Example Ideas** — Click any example chip to pre-fill the form

### Core Analysis Dashboard
- **Score Ring** — Animated 0–10 score with color-coded verdict badge
- **Verdict Reasoning** — Explains *why* the AI chose Build, Pivot, or Drop
- **Confidence & Demand Badges** — High/Medium/Low indicators with reasoning
- **Market Research Section** — Market size, TAM/SAM/SOM breakdown, target audience, key trends, competitors, competitor weaknesses, ideal first customer persona
- **Reasoning Basis** — AI reasoning chains and data points underpinning the analysis (replaces old "evidenceSources")
- **SWOT-style Cards** — Strengths, Weaknesses, Differentiation in a 3-column grid
- **Risks & Opportunities** — Side-by-side assessment
- **MVP Plan** — Core features, user flow (ordered), tech stack, architecture, build timeline
- **Monetization Strategy** — Business model, revenue streams, pricing tiers, unit economics
- **Go-To-Market Strategy** — Channels, strategy summary, timeline, first-100-users plan
- **Landing Page Content** — Headline, subheadline, value props, social proof, CTA preview
- **Structured Pitch Summary** — Problem, Solution, Market, Product, Business Model, Unique Advantage

### Sample Landing Page
- For Build/Pivot verdicts, the LLM generates a complete HTML landing page
- Previewed in an embedded iframe with browser-style chrome
- Can be opened in a new tab for full-screen viewing
- Disabled by default (set `SKIP_SAMPLE_PAGE=false` to enable)

### PDF Export
- One-click PDF report generation via the browser's native print-to-PDF (no external API needed)
- Comprehensive report with all analysis sections formatted for print
- Auto-downloads as `startup-intel-report.pdf`

### Shareable Reports
- Every analysis gets a unique URL at `/analysis/[id]`
- Copy-to-clipboard share button
- Full dashboard rendered on the detail page

### Analysis History
- Searchable with debounced text search
- Filterable by verdict (All / Build / Pivot / Drop)
- Expandable rows showing the full dashboard inline
- Direct links to individual analysis detail pages

### Credit Awareness
- Daily analysis counter (localStorage-based, threshold: 10)
- Warning banner appears when usage is high to remind about LLM credit consumption

### Refine & Re-analyze
- After viewing results, "Refine Idea" pre-fills the form with your original idea text
- "New Analysis" resets to a blank form

### Reliability
- **LLM Retry Logic** — Automatic retry with exponential backoff (up to 3 attempts) for transient LLM API failures
- **salvageJSON** — Resilient JSON parsing that handles truncated output, trailing commas, and markdown fences from LLM responses
- **Duplicate Detection** — Case-insensitive, 24-hour window by default (saves credits for repeated ideas)
- **Graceful Degradation** — Reasoning basis, sample pages, and newer schema fields render only when available, maintaining backward compatibility with older analyses

---

## Project Structure

```
nextjs_space/
├── app/
│   ├── page.tsx                         # Home — HeroSection orchestrator
│   ├── layout.tsx                       # Root layout (fonts, theme, metadata)
│   ├── globals.css                      # Theme variables, Tailwind config
│   ├── _components/
│   │   ├── hero-section.tsx             # Main flow: idle → loading → completed → error + credit warning
│   │   ├── idea-form.tsx                # Textarea + file upload + Ctrl+Enter + example chips
│   │   ├── loading-state.tsx            # 3-step progress with rotating messages
│   │   ├── analysis-dashboard.tsx       # Full results display (PDF, share, sample page)
│   │   ├── header.tsx                   # Sticky nav (Analyze / History)
│   │   └── dashboard/
│   │       ├── score-card.tsx            # Animated score ring + verdict badges
│   │       ├── section-card.tsx          # Reusable card with icon + color variant
│   │       └── bullet-list.tsx           # Ordered/unordered list renderer
│   ├── history/
│   │   ├── page.tsx
│   │   └── _components/history-list.tsx  # Search, filter, expand, link to detail
│   ├── analysis/[id]/
│   │   ├── page.tsx
│   │   └── _components/detail-view.tsx   # Shareable analysis page
│   └── api/
│       ├── analyze/route.ts              # 3-step streaming analysis (SSE)
│       ├── analyses/route.ts             # GET — list with search & filter
│       ├── analyses/[id]/route.ts        # GET — single analysis by ID
│       ├── export-pdf/route.ts           # POST — HTML2PDF generation
│       ├── extract-text/route.ts         # POST — PDF/DOCX text extraction
│       └── sample/[id]/route.ts          # GET — serve sample landing page HTML
├── lib/
│   ├── config.ts                         # Centralized configuration (LLM, PDF, extraction, analysis)
│   ├── llm.ts                            # Provider-agnostic LLM client + salvageJSON helper
│   ├── analysis-types.ts                 # TypeScript interfaces
│   ├── prisma.ts                         # Prisma client singleton
│   └── utils.ts                          # cn() utility
├── prisma/
│   └── schema.prisma                     # Analysis model
├── public/
│   ├── favicon.svg
│   └── og-image.png
└── components/                           # Shared UI (theme-toggle, sonner, button, card)
```

---

## API Routes

### `POST /api/analyze`
Streaming SSE endpoint. Accepts `{ idea: string }` (up to 5,000 characters) and streams progress events:

```
data: {"status":"processing","step":1,"totalSteps":3,"message":"Deep market research..."}
data: {"status":"step_complete","step":1}
data: {"status":"processing","step":2,"totalSteps":3,"message":"Generating MVP..."}
data: {"status":"step_complete","step":2}
data: {"status":"step_complete","step":3}
data: {"status":"completed","result":{...},"analysisId":"clxyz..."}
```

Includes:
- Automatic retry with exponential backoff (up to 3 attempts per step)
- Case-insensitive duplicate detection (24h default window)
- Calibration check in the analysis prompt for more honest scoring

### `GET /api/analyses?search=X&verdict=Build&limit=50`
Returns array of analysis records. Supports text search (case-insensitive on `idea`) and verdict filtering.

### `GET /api/analyses/[id]`
Returns a single analysis record by ID.

### `POST /api/export-pdf`
Accepts `{ id: string }`. Returns a print-formatted HTML report that the browser converts to PDF via its native print dialog.

### `POST /api/extract-text`
Accepts a file upload (multipart form data) and extracts text content:
- **PDF** — Base64-encodes the file and sends to the LLM API with vision capabilities
- **DOCX** — Parses using the mammoth library for raw text extraction

Returns `{ text, fileName, truncated, originalLength }` with the extracted content.

### `GET /api/sample/[id]`
Serves the generated sample landing page HTML for a given analysis. Returns a fallback page if no sample exists.

---

## Data Model

```prisma
model Analysis {
  id         String   @id @default(cuid())
  idea       String
  score      Int
  confidence String
  verdict    String
  result     Json     // Full AnalysisResult object
  createdAt  DateTime @default(now())

  @@index([createdAt])
}
```

---

## Analysis Result Schema

The `AnalysisResult` type contains:

- `ideaScore` (0–10), `confidence` (High/Medium/Low), `confidenceReasoning`
- `verdict` (Build/Pivot/Drop), `verdictReasoning`
- `demandLevel`, `marketSaturation`
- `researchSummary` — marketSize, TAM, SAM, SOM, trends[], competitors[], competitorWeaknesses[], targetAudience, buyerPersona
- `strengths[]`, `weaknesses[]`, `differentiation[]`, `risks[]`, `opportunities[]`
- `mvpPlan` — coreFeatures[], userFlow[], techStack[], architecture, buildTimeline
- `monetization` — model, revenueStreams[], pricingTiers[], unitEconomics
- `goToMarket` — channels[], strategy, timeline, firstHundredUsers
- `landingPageContent` — headline, subheadline, valueProps[], cta, socialProof
- `reasoningBasis[]` — AI reasoning chains and data citations underpinning the analysis
- `pitchSummary` — problem, solution, market, product, businessModel, uniqueAdvantage
- `samplePageHtml?` — Full HTML landing page (Build/Pivot only)

---

## The 3-Step Chain-of-Thought Process

### Step 1: Research & Critical Analysis
The LLM receives a system prompt that applies **5 analytical lenses** (Problem Validity, Market Reality, Competitive Landscape, Execution Feasibility, Timing & Moat). It performs:
- Market sizing with TAM/SAM/SOM estimates
- Competitor identification and weakness analysis
- Buyer persona creation
- Demand and saturation assessment
- Scoring (0–10) with confidence and verdict reasoning
- **Reasoning Transparency** — every claim states its source or marks estimates as "AI-estimated"
- **Calibration Check** — verifies score-verdict consistency, weakness reflection, and confidence honesty

### Step 2: Execution Planning
Receives Step 1 output as context. The LLM generates:
- Lean MVP architecture with specific tech stack recommendations
- Monetization model with unit economics
- Go-to-market strategy with a concrete first-100-users plan
- Landing page copywriting (headline, value props, social proof)
- Structured pitch summary (6 components)

### Step 3: Sample Landing Page
For Build or Pivot verdicts only (disabled by default). The LLM generates a complete, self-contained HTML landing page:
- Brand name and visual identity derived from the idea
- Hero section with headline and CTA from Step 2
- Features section, social proof, pricing preview
- Fully responsive design with embedded CSS
- No external dependencies (single HTML file)

---

## Theme

The app uses a purple-accent design system with CSS custom properties for full light/dark mode support. Primary color: `hsl(262, 83%, 58%)`. The theme toggle supports System, Light, and Dark modes.

---

## Configuration

All settings are centralized in `lib/config.ts` and controlled via environment variables.

### Core Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite connection string |
| `LLM_API_URL` | `https://openrouter.ai/api/v1` | OpenAI-compatible API base URL |
| `LLM_API_KEY` / `OPENROUTER_API_KEY` | — | LLM provider API key (get one at https://openrouter.ai/keys) |
| `LLM_MODEL` | `google/gemini-2.5-flash` | Model identifier — see https://openrouter.ai/models |

### Cost Optimization Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SKIP_SAMPLE_PAGE` | `true` | Set to `false` to enable landing page generation (~40% more tokens) |
| `DEDUPE_HOURS` | `24` | Reuse results for identical ideas within N hours (case-insensitive) |
| `STEP1_MAX_TOKENS` | `3000` | Max tokens for research step |
| `STEP2_MAX_TOKENS` | `2500` | Max tokens for execution step |
| `STEP3_MAX_TOKENS` | `4000` | Max tokens for landing page step |
| `LLM_TEMPERATURE` | `0.4` | Lower = more deterministic, fewer retries |

### Supported LLM Providers

The app uses the OpenAI-compatible chat/completions API, so it works with:
- **OpenAI** (gpt-4o-mini, gpt-4o)
- **Groq** (llama-3.3-70b — free tier available)
- **Together AI** (llama-3.1-70b)
- **Fireworks AI**, **Mistral AI**, **OpenRouter**
- **Ollama** (local, free, private)
- Any OpenAI-compatible endpoint

---

## Development

```bash
cd nextjs_space
npm install
npx prisma generate
npm run dev
```

The app runs on `http://localhost:3000` by default (pass `-p <port>` to `next dev` to use a different port).
