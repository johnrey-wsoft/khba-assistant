CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "verification_status" "verification_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
-- Backfill: members who already completed onboarding keep access (approved),
-- so this migration doesn't lock out existing users. New rows stay pending.
UPDATE "profiles" SET "verification_status" = 'approved' WHERE "onboarding_completed" = true;
