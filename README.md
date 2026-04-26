# Agentic Healthcare Intelligence MVP

Production-style hackathon MVP for India-focused healthcare discovery: ingesting messy facility reports, structuring capabilities, matching facilities to natural-language patient needs, and explaining recommendations.

## Tech Stack

- Next.js App Router (JavaScript)
- Tailwind CSS
- shadcn-style UI primitives (table-first)
- NextAuth (credentials demo auth)
- Rule-based agentic processing (free, no paid APIs)
- Local India JSON data (30 facilities) with simulated 10,000-report indexing pattern

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Set `AUTH_SECRET` in `.env.local` (long random string).
4. Run:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)
6. Login with:
   - `admin@healthintel.io` / `demo1234`

## Main User Flow

1. Login at `/login`.
2. Open protected `/dashboard`.
3. Search in `/search` (example: `Find nearest facility in rural Bihar for emergency appendectomy with part-time doctors`).
4. Review ranked facilities in a professional table.
5. Open `/facility/[id]` for details + explanation reasoning.

## API Routes

- `POST /api/process` -> structures messy report text into normalized capabilities.
- `POST /api/search` -> performs intent detection + capability ranking.
- `POST /api/explain` -> returns clear, decision-ready reasoning.

## Architecture Notes

- `lib/agentic.js` encapsulates:
  - report processing
  - query interpretation
  - scoring/ranking
  - explanation generation
- Search simulates scale by chunking indexed records and merging ranked results to represent 10k+ corpus behavior.
- Includes trust scoring and contradiction flags aligned to the challenge Trust Scorer requirement.
