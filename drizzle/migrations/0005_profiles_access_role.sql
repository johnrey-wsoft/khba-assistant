CREATE TYPE "public"."access_role" AS ENUM('admin', 'member');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "access_role" "access_role" DEFAULT 'member' NOT NULL;