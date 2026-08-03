import { pgEnum } from "drizzle-orm/pg-core";

// WS-1267 §4-2 — canonical 6-grade source taxonomy (Detailed Design §9).
// Replaces the Initiation Design's 4-category `source_type`.
export const authorityTypeEnum = pgEnum("authority_type", [
  "LAW",
  "ORDINANCE",
  "ADMIN_RULE",
  "INTERPRETATION",
  "ASSOCIATION_GUIDE",
  "MEMBER_CASE",
]);

// WS-1267 §5-2 — kept from Detailed Design §17 / Appendix D.
export const securityClassEnum = pgEnum("security_class", [
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
]);

// WS-1267 §4-6 — canonical 6-state review workflow (Detailed Design §52).
// The Initiation Design's 3 states map to a dashboard rollup, not stored here.
export const approvalStatusEnum = pgEnum("approval_status", [
  "DRAFT",
  "IN_REVIEW",
  "LEGAL_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "RETIRED",
]);

// WS-1267 §6-2 — concretizes the Initiation Design's "splitting principle":
// law article/clause hierarchy, tables, guide topics, and the 4-part case split.
export const chunkTypeEnum = pgEnum("chunk_type", [
  "LAW_ARTICLE",
  "LAW_CLAUSE",
  "TABLE",
  "GUIDE_TOPIC",
  "CASE_SITUATION",
  "CASE_JUDGMENT",
  "CASE_RESULT",
  "CASE_CAUTION",
]);

// WS-1267 §6-4 — OpenSearch indexing lifecycle for an evidence unit.
export const indexStatusEnum = pgEnum("index_status", [
  "PENDING",
  "INDEXED",
  "FAILED",
]);
