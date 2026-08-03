import {
  pgTable,
  uuid,
  integer,
  date,
  char,
  varchar,
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
    // §4-5 — actual storage for the §19 raw-object path convention.
    rawObjectPath: varchar("raw_object_path", { length: 500 }).notNull(),
    approvalStatus: approvalStatusEnum("approval_status")
      .notNull()
      .default("DRAFT"),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex("document_version_doc_no_uq").on(t.documentId, t.versionNo),
    index("document_version_effective_from_idx").on(t.effectiveFrom),
    index("document_version_effective_to_idx").on(t.effectiveTo),
    index("document_version_approval_status_idx").on(t.approvalStatus),
  ],
);
