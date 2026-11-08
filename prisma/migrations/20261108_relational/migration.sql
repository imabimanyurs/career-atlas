-- Additive Career Atlas relational schema. SQLite is backed up and retained separately.
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "profile" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Session" (
  "hash" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "passwordVersion" TEXT NOT NULL
);
CREATE TABLE "Company" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "aliases" TEXT[] NOT NULL DEFAULT '{}',
  "website" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'company'
);
CREATE TABLE "TargetCompany" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "saved" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL DEFAULT 2,
  "stage" TEXT NOT NULL DEFAULT 'Research',
  "country" TEXT NOT NULL DEFAULT '',
  "notes" TEXT NOT NULL DEFAULT '',
  "contact" TEXT NOT NULL DEFAULT ''
);
CREATE TABLE "CompanySource" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "tenant" TEXT NOT NULL DEFAULT '',
  "config" JSONB NOT NULL DEFAULT '{}',
  "ownershipEvidenceUrl" TEXT NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "health" TEXT NOT NULL DEFAULT 'never_checked',
  "lastError" TEXT NOT NULL DEFAULT '',
  "lastCheckedAt" TIMESTAMP(3),
  "lastSuccessAt" TIMESTAMP(3),
  "nextDueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Job" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identity" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "sourceId" TEXT,
  "externalId" TEXT NOT NULL,
  "requisitionId" TEXT NOT NULL DEFAULT '',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "country" TEXT NOT NULL DEFAULT '',
  "location" TEXT NOT NULL DEFAULT '',
  "locations" JSONB NOT NULL DEFAULT '[]',
  "workplace" TEXT NOT NULL DEFAULT 'Unspecified',
  "employmentType" TEXT NOT NULL DEFAULT 'Unspecified',
  "experience" TEXT NOT NULL DEFAULT '',
  "salaryMin" DOUBLE PRECISION,
  "salaryMax" DOUBLE PRECISION,
  "salaryCurrency" TEXT NOT NULL DEFAULT '',
  "salaryPeriod" TEXT NOT NULL DEFAULT '',
  "salaryText" TEXT NOT NULL DEFAULT '',
  "skills" TEXT[] NOT NULL DEFAULT '{}',
  "requiredSkills" TEXT[] NOT NULL DEFAULT '{}',
  "authorisation" TEXT NOT NULL DEFAULT 'Unspecified',
  "sponsorship" TEXT NOT NULL DEFAULT 'Unspecified',
  "sponsorshipEvidence" TEXT NOT NULL DEFAULT '',
  "sponsorshipEvidenceUrl" TEXT NOT NULL DEFAULT '',
  "postingUrl" TEXT NOT NULL,
  "applyUrl" TEXT NOT NULL,
  "sourcePublishedAt" TIMESTAMP(3),
  "sourceRepublishedAt" TIMESTAMP(3),
  "sourceUpdatedAt" TIMESTAMP(3),
  "dateMeaning" TEXT NOT NULL DEFAULT 'unknown',
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastVerifiedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "availability" TEXT NOT NULL DEFAULT 'open',
  "missingScans" INTEGER NOT NULL DEFAULT 0,
  "contentHash" TEXT NOT NULL,
  "duplicateKey" TEXT NOT NULL,
  "evidence" JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE "JobChange" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "summary" TEXT NOT NULL,
  "before" JSONB NOT NULL,
  "after" JSONB NOT NULL
);
CREATE TABLE "JobMatch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "gaps" TEXT[] NOT NULL DEFAULT '{}',
  "reasons" JSONB NOT NULL DEFAULT '[]',
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "Application" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Saved',
  "appliedAt" TIMESTAMP(3),
  "interviewStage" TEXT NOT NULL DEFAULT '',
  "interviewAt" TIMESTAMP(3),
  "referralContact" TEXT NOT NULL DEFAULT '',
  "notes" TEXT NOT NULL DEFAULT '',
  "skillGaps" TEXT NOT NULL DEFAULT '',
  "resumeVersion" TEXT NOT NULL DEFAULT '',
  "nextAction" TEXT NOT NULL DEFAULT '',
  "followUpAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "ApplicationEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "applicationId" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Referral" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactUrl" TEXT NOT NULL DEFAULT '',
  "stage" TEXT NOT NULL DEFAULT 'Identified',
  "notes" TEXT NOT NULL DEFAULT '',
  "followUpAt" TIMESTAMP(3)
);
CREATE TABLE "PrepTask" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'General',
  "skill" TEXT NOT NULL DEFAULT '',
  "done" BOOLEAN NOT NULL DEFAULT false,
  "dueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "SavedSearch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "filters" JSONB NOT NULL,
  "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Alert" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "dedupKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "jobId" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "SourceRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceId" TEXT NOT NULL,
  "scheduleKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseUntil" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "externalRunId" TEXT,
  "datasetId" TEXT,
  "counts" JSONB NOT NULL DEFAULT '{}',
  "complete" BOOLEAN NOT NULL DEFAULT false,
  "error" TEXT NOT NULL DEFAULT '',
  "costCapUsd" DOUBLE PRECISION NOT NULL DEFAULT 0
);
CREATE TABLE "GovernmentNotice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "advertisementId" TEXT NOT NULL DEFAULT '',
  "publishedAt" TIMESTAMP(3),
  "deadline" TIMESTAMP(3),
  "requirements" TEXT NOT NULL DEFAULT '',
  "reviewStatus" TEXT NOT NULL DEFAULT 'Needs review',
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "MigrationRecord" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "details" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "WebhookReceipt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "LoginAttempt" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "User_key_key" ON "User" ("key");
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Session_expiresAt_idx" ON "Session" ("expiresAt");
CREATE UNIQUE INDEX "Company_name_key" ON "Company" ("name");
ALTER TABLE "TargetCompany" ADD CONSTRAINT "TargetCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TargetCompany" ADD CONSTRAINT "TargetCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "TargetCompany_userId_companyId_key" ON "TargetCompany" ("userId", "companyId");
ALTER TABLE "CompanySource" ADD CONSTRAINT "CompanySource_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "CompanySource_companyId_url_key" ON "CompanySource" ("companyId", "url");
CREATE INDEX "CompanySource_enabled_nextDueAt_idx" ON "CompanySource" ("enabled", "nextDueAt");
CREATE UNIQUE INDEX "Job_identity_key" ON "Job" ("identity");
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CompanySource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Job_sourceId_externalId_key" ON "Job" ("sourceId", "externalId");
CREATE INDEX "Job_country_availability_sourcePublishedAt_idx" ON "Job" ("country", "availability", "sourcePublishedAt");
CREATE INDEX "Job_lastSeenAt_id_idx" ON "Job" ("lastSeenAt", "id");
CREATE INDEX "Job_duplicateKey_idx" ON "Job" ("duplicateKey");
ALTER TABLE "JobChange" ADD CONSTRAINT "JobChange_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "JobMatch_userId_jobId_key" ON "JobMatch" ("userId", "jobId");
CREATE INDEX "JobMatch_userId_score_jobId_idx" ON "JobMatch" ("userId", "score", "jobId");
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Application_userId_jobId_key" ON "Application" ("userId", "jobId");
CREATE INDEX "Application_userId_status_updatedAt_idx" ON "Application" ("userId", "status", "updatedAt");
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PrepTask" ADD CONSTRAINT "PrepTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Alert_userId_dedupKey_key" ON "Alert" ("userId", "dedupKey");
ALTER TABLE "SourceRun" ADD CONSTRAINT "SourceRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CompanySource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "SourceRun_scheduleKey_key" ON "SourceRun" ("scheduleKey");
CREATE INDEX "SourceRun_status_availableAt_idx" ON "SourceRun" ("status", "availableAt");
ALTER TABLE "GovernmentNotice" ADD CONSTRAINT "GovernmentNotice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "GovernmentNotice_url_key" ON "GovernmentNotice" ("url");
