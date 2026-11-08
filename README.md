# Career Atlas

Searchable software engineering job board, browser-saved application tracker, company watchlist, referral workflow and preparation dashboard.

## Publish

In repository Settings → Pages, choose Deploy from a branch, main, /docs, then Save. No build or paid service is required.

## Data

The public jobs feed is docs/jobs.json. See SEARCH_WORKFLOW.md for research and verification rules. companies.json contains the 403-company watchlist. The scheduled search task updates the public feed, not personal application records.

Application statuses, interview stages, dates, contacts and notes are saved only in localStorage in the current browser. Export JSON in Settings before changing devices or clearing browser data. Personal tracker data is not uploaded to GitHub.

Daily feed updates preserve application fields. Existing vacancy verification expires after 48 hours. Evidence is recorded by the researcher; a checked label is not an independent guarantee of sponsorship. Inspect the official application page before acting.
