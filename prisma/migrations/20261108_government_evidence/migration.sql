ALTER TABLE "GovernmentNotice" ADD COLUMN "deadlineEvidence" TEXT NOT NULL DEFAULT '';
ALTER TABLE "GovernmentNotice" ADD COLUMN "lastVerifiedAt" TIMESTAMP(3);
