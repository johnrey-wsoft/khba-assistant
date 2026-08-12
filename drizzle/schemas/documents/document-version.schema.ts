import {
  pgTable,
  uuid,
  integer,
  bigint,
  date,
  char,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Audit columns (created/updated/deleted)
import { auditColumns } from "../base";
import { document } from "./document.schema";
import { approvalStatusEnum } from "./enums";

// WS-1267 §6-2 — `document_version`: the effective version at a point in time.
export const documentVersion = pgTable(
  "document_version",
  {
    versionId: uuid("version_id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => document.documentId, { onDelete: "cascade" }),
    versionNo: integer("version_no").notNull(),
    effectiveFrom: date("effective_from"),
    // NULL = currently effective
    effectiveTo: date("effective_to"),
    // §6 `version_hash` (SHA-256)
    sourceHash: char("source_hash", { length: 64 }).notNull(),
    // §4-5 — Cloudflare R2 object key for the raw file (the §19 raw-object path
    // convention, e.g. "raw/LAW-2026-000123/v1.hwp").
    rawObjectPath: varchar("raw_object_path", { length: 500 }).notNull(),
    // R2 object metadata — nullable so existing rows and the trigger-created
    // path are unaffected; populated when the raw file is uploaded to R2.
    storageBucket: varchar("storage_bucket", { length: 100 }),
    contentType: varchar("content_type", { length: 100 }),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    originalFilename: varchar("original_filename", { length: 255 }),
    etag: varchar("etag", { length: 255 }),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
    approvalStatus: approvalStatusEnum("approval_status").notNull().default("DRAFT"),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex("document_version_doc_no_uq").on(t.documentId, t.versionNo),
    index("document_version_effective_from_idx").on(t.effectiveFrom),
    index("document_version_effective_to_idx").on(t.effectiveTo),
    index("document_version_approval_status_idx").on(t.approvalStatus),
  ]
);
