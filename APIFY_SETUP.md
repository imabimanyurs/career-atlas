> Historical v1 document. The deployed v2 architecture and source policy are documented in [UPGRADE_V2.md](UPGRADE_V2.md) and [README.md](README.md). Employer-authorised ATS portals are accepted.

# Direct-career collector

Set APIFY_TOKEN on the existing Railway career-atlas service. The backend uses Apify's official apify/cheerio-scraper Actor, authenticating only through an Authorization header. Secrets are not sent in Actor input, returned from the app or stored in GitHub.

## Operation

The backend starts one bounded crawl per day at or after 08:00 Asia/Kolkata, checking the scheduler every minute. Initial activation after 08:00 starts that day's crawl. It resumes pending runs after a restart, ingests the Apify dataset into private SQLite, and merges researched job details separately from personal application fields. Search Activity displays configuration coverage, run status, rejections and official notices awaiting manual review.

Limits: one Actor run per local calendar day, maximum 150 pages, 300-second timeout, 512 MB memory and maxTotalChargeUsd=0.50. Input includes no paid proxy. These are intentionally bounded initial settings and cannot promise exhaustive coverage of every configured page.

## Strict eligibility

Only approved HTTPS company-owned hosts in collector-sources.json are allowed. Workday, Ashby, Greenhouse, Lever, SmartRecruiters and aggregator hosts are excluded, including external redirects. A JobPosting structured-data record must have an explicit datePosted within seven days, an exact job ID, a software/developer role and an approved official URL. Undated, expired, future-dated and older vacancies do not appear on the job board. Third-party and stale listings already tracked remain available in Applications; statuses and notes are preserved.

This initial HTML collector handles server-rendered JobPosting structured data. JavaScript-only content and PDF notices need further adapters or manual research; they are never presented as successfully verified jobs. Government notices are queued for date and eligibility review. No birth date, certificate or GATE eligibility is assumed.

## Sources and coverage

The initial registry covers six of the 403 target companies (SAP, Adyen, Wise, Amazon, Google and Apple), plus ISRO and NIELIT. Amazon has two country search URLs. Remaining company sources must be verified and added to collector-sources.json before automated crawling. The daily ChatGPT research task supplements the collector and should expand this registry only after verifying company ownership. Never claim all 403 have been checked when coverage is partial.

Routine research can continue updating docs/jobs.json; the backend applies the same direct-source and freshness policy to board visibility. Registry updates are read at the next daily crawl. A manually saved source or company record does not automatically approve a hostname for scraping.
