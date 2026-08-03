CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('DRAFT', 'IN_REVIEW', 'LEGAL_REVIEW', 'APPROVED', 'PUBLISHED', 'RETIRED');--> statement-breakpoint
CREATE TYPE "public"."authority_type" AS ENUM('LAW', 'ORDINANCE', 'ADMIN_RULE', 'INTERPRETATION', 'ASSOCIATION_GUIDE', 'MEMBER_CASE');--> statement-breakpoint
CREATE TYPE "public"."chunk_type" AS ENUM('LAW_ARTICLE', 'LAW_CLAUSE', 'TABLE', 'GUIDE_TOPIC', 'CASE_SITUATION', 'CASE_JUDGMENT', 'CASE_RESULT', 'CASE_CAUTION');--> statement-breakpoint
CREATE TYPE "public"."index_status" AS ENUM('PENDING', 'INDEXED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."security_class" AS ENUM('PUBLIC', 'INTERNAL', 'CONFIDENTIAL');--> statement-breakpoint
CREATE TABLE "content_node" (
	"node_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"parent_node_id" uuid,
	"node_path" text NOT NULL,
	"chunk_type" "chunk_type" NOT NULL,
	"table_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "document" (
	"document_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_code" varchar(50) NOT NULL,
	"title" varchar(500) NOT NULL,
	"authority_type" "authority_type" NOT NULL,
	"jurisdiction_code" varchar(20),
	"security_class" "security_class" DEFAULT 'PUBLIC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "document_topic_tag" (
	"document_id" uuid NOT NULL,
	"tag" varchar(50) NOT NULL,
	CONSTRAINT "document_topic_tag_document_id_tag_pk" PRIMARY KEY("document_id","tag")
);
--> statement-breakpoint
CREATE TABLE "document_version" (
	"version_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version_no" integer NOT NULL,
	"effective_from" date,
	"effective_to" date,
	"source_hash" char(64) NOT NULL,
	"raw_object_path" varchar(500) NOT NULL,
	"approval_status" "approval_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "source_evidence" (
	"evidence_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"original_text" text NOT NULL,
	"normalized_text" text,
	"locator_json" jsonb NOT NULL,
	"evidence_grade" char(1) NOT NULL,
	"citation_label" varchar(200),
	"embedding_version" varchar(50),
	"evidence_embedding" halfvec(1536),
	"index_status" "index_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "content_node" ADD CONSTRAINT "content_node_version_id_document_version_version_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."document_version"("version_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_node" ADD CONSTRAINT "content_node_parent_node_id_content_node_node_id_fk" FOREIGN KEY ("parent_node_id") REFERENCES "public"."content_node"("node_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_topic_tag" ADD CONSTRAINT "document_topic_tag_document_id_document_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("document_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_document_id_document_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("document_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_evidence" ADD CONSTRAINT "source_evidence_version_id_document_version_version_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."document_version"("version_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_evidence" ADD CONSTRAINT "source_evidence_node_id_content_node_node_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."content_node"("node_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_node_version_id_idx" ON "content_node" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "content_node_parent_node_id_idx" ON "content_node" USING btree ("parent_node_id");--> statement-breakpoint
CREATE INDEX "content_node_node_path_idx" ON "content_node" USING btree ("node_path");--> statement-breakpoint
CREATE INDEX "content_node_chunk_type_idx" ON "content_node" USING btree ("chunk_type");--> statement-breakpoint
CREATE UNIQUE INDEX "document_code_uq" ON "document" USING btree ("document_code");--> statement-breakpoint
CREATE INDEX "document_authority_type_idx" ON "document" USING btree ("authority_type");--> statement-breakpoint
CREATE INDEX "document_jurisdiction_code_idx" ON "document" USING btree ("jurisdiction_code");--> statement-breakpoint
CREATE INDEX "document_security_class_idx" ON "document" USING btree ("security_class");--> statement-breakpoint
CREATE INDEX "document_topic_tag_tag_idx" ON "document_topic_tag" USING btree ("tag");--> statement-breakpoint
CREATE UNIQUE INDEX "document_version_doc_no_uq" ON "document_version" USING btree ("document_id","version_no");--> statement-breakpoint
CREATE INDEX "document_version_effective_from_idx" ON "document_version" USING btree ("effective_from");--> statement-breakpoint
CREATE INDEX "document_version_effective_to_idx" ON "document_version" USING btree ("effective_to");--> statement-breakpoint
CREATE INDEX "document_version_approval_status_idx" ON "document_version" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "source_evidence_version_id_idx" ON "source_evidence" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "source_evidence_node_id_idx" ON "source_evidence" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "source_evidence_evidence_grade_idx" ON "source_evidence" USING btree ("evidence_grade");--> statement-breakpoint
CREATE INDEX "source_evidence_index_status_idx" ON "source_evidence" USING btree ("index_status");--> statement-breakpoint
CREATE INDEX "source_evidence_embedding_hnsw" ON "source_evidence" USING hnsw ("evidence_embedding" halfvec_cosine_ops);