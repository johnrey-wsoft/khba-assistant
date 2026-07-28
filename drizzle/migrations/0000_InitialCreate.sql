CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"email" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"image_url" varchar(255)
);
  