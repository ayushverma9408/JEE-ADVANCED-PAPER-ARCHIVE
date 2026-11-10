-- Add immutable evaluated result details for historical attempt review.
ALTER TABLE "ExamAttempt" ADD COLUMN "resultData" JSONB;
