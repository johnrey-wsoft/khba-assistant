ALTER TABLE "profiles" ADD COLUMN "company" varchar(200);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "business_registration_number" varchar(20);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "member_number" varchar(50);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "role" varchar(50);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "topics" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "marketing_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "terms_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "terms_version" varchar(20);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;