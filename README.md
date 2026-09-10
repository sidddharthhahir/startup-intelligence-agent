# Startup Intel — AI Startup Intelligence Agent

AI-powered startup idea validation with due diligence, execution planning, and optional landing page generation.

## Overview

Startup Intel analyzes a startup idea and returns a structured report to help founders decide whether to build, pivot, or drop the concept. It combines market and competitive research, execution guidance, and a shareable analysis workflow in a single app.

## Key Features

- End-to-end 3-step analysis pipeline with scored verdicts (Build / Pivot / Drop)
- Market intelligence output (TAM/SAM/SOM, competitors, buyer persona, risks, opportunities)
- Execution playbook (MVP scope, architecture direction, monetization, GTM strategy)
- Optional generated sample landing page for Build/Pivot outcomes
- Shareable analysis pages and searchable history
- PDF export support and file-based input extraction (PDF/DOCX)

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM + SQLite
- OpenAI-compatible LLM provider integrations

## Setup & Run

```bash
cd nextjs_space
npm install
npx prisma generate
npm run dev
```

Default local URL: `http://localhost:3000`

## Usage

1. Open the app and enter a startup idea (or upload a PDF/DOCX file).
2. Run analysis and follow real-time progress updates.
3. Review score, verdict, research summary, and execution recommendations.
4. Share results via generated analysis URL or export the report to PDF.

## Project Structure

```text
nextjs_space/
├── app/                 # UI routes and API routes
├── lib/                 # Config, LLM client, types, utilities
├── prisma/              # Database schema
├── public/              # Static assets
└── components/          # Shared UI components
```

## Contributing

Contributions are welcome. Please open an issue for discussion before submitting major changes.

## License / Contact

Licensed under [MIT](LICENSE). For questions or collaboration, open an issue in this repository.
