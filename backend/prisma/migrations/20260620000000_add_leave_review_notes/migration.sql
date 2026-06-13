-- Add a nullable column to persist the reviewer's note recorded when a
-- leave request is approved or rejected (Requirement 9.3). The reviewer
-- identity and decision timestamp continue to use the existing
-- `approved_by` / `approved_at` columns; this column captures the free-text
-- rejection/approval note that previously had no home in the schema.
ALTER TABLE "leave_requests" ADD COLUMN "review_notes" TEXT;
