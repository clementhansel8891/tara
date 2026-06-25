-- Add PIN hash field to Employee table for attendance verification
ALTER TABLE "Employee" ADD COLUMN "pin_hash" TEXT;
