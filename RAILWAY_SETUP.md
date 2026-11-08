> Historical v1 document. The deployed v2 architecture and source policy are documented in [UPGRADE_V2.md](UPGRADE_V2.md) and [README.md](README.md). Employer-authorised ATS portals are accepted.

# Railway deployment

The repository contains a dependency-free Node 24 backend, SQLite persistence and a private frontend. Dockerfile plus railway.json replace the previous static-only build setup.

1. Keep the existing career-atlas Railway service linked to this repository, branch main, root directory /.
2. Attach one persistent volume to the service at /data. Keep one replica. The application requires Railway's RAILWAY_VOLUME_MOUNT_PATH and refuses to start there without a volume.
3. Set a unique TRACKER_PASSWORD (at least 16 characters) in Railway Variables. Do not put the password in source, GitHub issues or chat. Docker sets NODE_ENV=production.
4. Deploy the latest commit. Railway uses Dockerfile and starts node server/app.mjs. Health check is /healthz. The server binds 0.0.0.0 and Railway's PORT.
5. Under Settings → Networking, Generate Domain. Open that HTTPS domain and sign in with the workspace password.
6. Change one application status, reload and verify it remains. Sign in from another device to verify sync. Enable Railway volume backups.

## Existing tracker migration

In the GitHub Pages tracker, export JSON in Settings. Sign into the Railway app, then import the file in Settings. It replaces the server workspace after confirmation. Export the server workspace first if it already contains records. Neither statuses nor contacts are stored in the public repository.

## Daily openings

The existing daily task updates only docs/jobs.json in GitHub. The backend pulls that public feed at startup and every 10 minutes. Search Activity also has a manual refresh. Public role details update independently of private application status, dates, referral contact, interview stage, notes and gaps. Verification labels expire after 48 hours. Failed feed refreshes retain the previous saved feed.

The source connection may trigger a Railway deployment on job-feed commits. The persistent volume preserves the tracker across those deployments. Optional watch-pattern optimisation can exclude feed-only commits after live deployment is verified.

## Access and backups

This is a single-owner workspace. Signed-in devices share one dataset. Sessions expire after seven days; changing TRACKER_PASSWORD invalidates existing sessions. Saves use revision checks to reject stale edits from another device. If a conflict occurs, export unsaved edits before reloading. Data lives at /data/career-atlas.sqlite, never the public Git repository. Keep Railway volume backups enabled and use JSON exports as an additional portable backup.

## Local use

Node 24 or newer; no package installation required. Set TRACKER_PASSWORD and optional DATA_DIR, then npm start. npm test exercises handlers and real SQLite persistence without requiring a network socket.
