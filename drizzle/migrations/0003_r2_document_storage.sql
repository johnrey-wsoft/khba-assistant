ALTER TABLE "document_version" ADD COLUMN "storage_bucket" varchar(100);--> statement-breakpoint
ALTER TABLE "document_version" ADD COLUMN "content_type" varchar(100);--> statement-breakpoint
ALTER TABLE "document_version" ADD COLUMN "size_bytes" bigint;--> statement-breakpoint
ALTER TABLE "document_version" ADD COLUMN "original_filename" varchar(255);--> statement-breakpoint
ALTER TABLE "document_version" ADD COLUMN "etag" varchar(255);--> statement-breakpoint
ALTER TABLE "document_version" ADD COLUMN "uploaded_at" timestamp with time zone;