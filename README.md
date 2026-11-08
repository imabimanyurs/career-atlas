# Career Atlas

Private overseas software-engineering job-search workspace. Production: https://career-atlas-production.up.railway.app

## Current architecture

React + Vite + Tailwind UI, NestJS API, Prisma/Postgres data and a separate Railway ingestion worker. All 403 original company targets are seeded. Approved source coverage is displayed separately from configured company names and successful checks.

Read [UPGRADE_V2.md](UPGRADE_V2.md) for the model, migration, ingestion, deployment and scope limits. The original SQLite volume is retained with a pre-migration backup. Private notes and contacts live in Postgres; they must never enter the public research feed.

## Development

Use Node 24. Install dependencies with npm install, generate the client with npx prisma generate, apply migrations with npx prisma migrate deploy, run npm test, then npm run build and npm start. Set DATABASE_URL and a unique TRACKER_PASSWORD using .env.example as a reference; environment variables must be loaded by your shell or deployment platform. ROLE=worker starts the ingestion process instead of the web app. Both processes expose /healthz internally. The Docker build runs tests and builds the UI.

## Ingestion and coverage

Native employer Greenhouse, Lever, Ashby and Workday APIs are preferred; structured company HTML and bounded Apify crawling supplement them. Verify the employer-to-tenant relationship before adding a source. Aggregators are excluded. Daily checks run around 08:00 Asia/Kolkata with staggering, durable queue leases and retry history. Apify defaults to a total daily reservation cap of $0.50 and $0.25 per run. The actor can require a separate permission approval; failures remain visible and do not prevent public API checks.

The daily research automation updates only docs/jobs.json and sources.v2.json. The worker refreshes them about hourly; this is separate from the 30-second queue loop. Source ownership, original posting dates, republication, discovery, and verification are distinct. An unknown date is never replaced with discovery time. A role becomes stale after 48 hours without verification. Government notices require manual eligibility and deadline review.

## Workspace

Paginated job feed; sponsorship, skill, country, freshness and source filters; explainable match scores; Kanban/list applications with notes, referrals, interview dates, follow-ups, status history and conflict protection; company watchlist; preparation; profile; saved searches/in-app alerts; CSV/JSON exports and additive backup import. One private owner workspace syncs across authenticated devices.

Earlier server/, worker/ and frontend/ implementations are retained as historical source; the deployed v2 entry points are backend/ and web/.
