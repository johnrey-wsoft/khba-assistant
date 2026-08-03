import { pgTable, uuid, varchar, index, uniqueIndex } from "drizzle-orm/pg-core";

// Audit columns (created/updated/deleted)
import { auditColumns } from "../base";
import { authorityTypeEnum, securityClassEnum } from "./enums";

// WS-1267 §6-1 — `document`: the logical document master.
export const document = pgTable(
  "document",
  {
    documentId: uuid("document_id").primaryKey().defaultRandom(),
    // §4-1 — preserves the Initiation Design's human-readable key (LAW-2026-000123)
    documentCode: varchar("document_code", { length: 50 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    authorityType: authorityTypeEnum("authority_type").notNull(),
    // §4-3 — admin-district code (e.g. 41390); NULL for nationwide documents.
    jurisdictionCode: varchar("jurisdiction_code", { length: 20 }),
    securityClass: securityClassEnum("security_class").notNull().default("PUBLIC"),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex("document_code_uq").on(t.documentCode),
    index("document_authority_type_idx").on(t.authorityType),
    index("document_jurisdiction_code_idx").on(t.jurisdictionCode),
    index("document_security_class_idx").on(t.securityClass),
  ],
);
