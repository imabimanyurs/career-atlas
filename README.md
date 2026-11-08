# Career Atlas

Job board and private application tracker for overseas software engineering roles, with a 403-company watchlist, referral workflow and interview preparation dashboard.

## Railway backend

Node 24, SQLite, password-protected sessions and persistent Railway volume storage. Follow RAILWAY_SETUP.md. The Dockerfile builds without external package installation. npm test checks authentication, CSRF, durable storage, revision conflicts and feed updates that preserve application fields.

Set TRACKER_PASSWORD in Railway Variables, attach /data and deploy main. Open the Railway domain to use the synced tracker. Do not commit credentials or personal application records.

## Daily openings

The scheduled search updates public docs/jobs.json. The backend checks for updates at startup and every ten minutes. Personal application statuses, referrals, interview stages and notes are saved separately in the private database. SEARCH_WORKFLOW.md describes research evidence and coverage reporting.

## Static version

docs/index.html still works on GitHub Pages, with browser-local data. To migrate, export JSON from its Settings and import into the Railway app. The import replaces the private server workspace after confirmation.
