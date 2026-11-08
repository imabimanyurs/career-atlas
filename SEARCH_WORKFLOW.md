# Daily search and publishing

Read companies.json for the complete 403-company target list. Search Software Engineer, Full-stack Developer/Engineer, Java Developer and React Developer roles. Prioritise Germany, Netherlands and Ireland; consider UK, Sweden, Denmark, Switzerland, Canada and Australia. Use the candidate preferences supplied privately to the scheduled task. Do not commit a personal candidate profile.

Also search official Indian government/PSU recruitment sources for CSE/IT degree opportunities. Do not assume age, category certificate, GATE or experience eligibility. Record precise requirements and deadlines in job notes and authorisation fields.

Read docs/jobs.json and preserve prior entries. Upsert by stable company + exact requisition ID. Only mark Verified current after opening the official vacancy page and confirming it is active. Store official URL, exact ID, evidence and checked timestamp. Confirmed sponsorship requires explicit official evidence and its URL; sponsor-register status alone is insufficient. Do not infer a posting date from search-engine crawl time. Mark closed only after explicit official evidence; inaccessible is Unverified, not closed.

Public feed schema: {jobs:[{id,company,country,role,salary,location,experience,skills,authorisation,jobId,officialUrl,listingUrl,postedAt,verifiedAt,evidence,sponsorshipEvidence,sponsorshipUrl,sponsorship,source,verification,fit,gaps,notes}],runs:[{at,checkedCompanies,checkedCount,targetCount,blockedCompanies,notCheckedCount,summary}],updatedAt}. Sponsorship values: Confirmed, Uncertain, Not offered. Source: Official career page or Third-party listing. Verification: Verified current, Unverified, Closed. Fit: Strong fit, Partial fit, Low fit, Not assessed.

Append an honest coverage record every run, including blocked and unfinished checks. Keep the latest 100 runs. Never claim all 403 companies checked unless each was checked. Government coverage must be recorded separately.

Update only docs/jobs.json through GitHub fetch_file + update_file using the returned current blob SHA. Retry a rejected update only after refetching and merging. Fetch the file after writing to verify the feed changed. GitHub Pages serves main /docs. Routine feed changes need no app rebuild. The browser reloads the feed on open and every five minutes. User application status, dates, referral contacts, interview stage, skill gaps and notes are local browser data and must never be committed to this public repository.
