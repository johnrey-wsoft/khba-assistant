import {
  pgTable,
  uuid,
  text,
  jsonb,
  char,
  varchar,
  index,
} from "drizzle-orm/pg-core";

// Audit columns (created/updated/deleted)
import { auditColumns } from "../base";
import { halfvec } from "../vector";
import { documentVersion } from "./document-version.schema";
import { contentNode } from "./content-node.schema";
import { indexStatusEnum } from "./enums";

// Embedding dimension — OpenAI text-embedding-3-small / ada-002 class.
export const EVIDENCE_EMBEDDING_DIMENSIONS = 1536;

// WS-1267 §6-4 — `source_evidence`: the smallest citable unit of evidence.
export const sourceEvidence = pgTable(
  "source_evidence",
  {
    evidenceId: uuid("evidence_id").primaryKey().defaultRandom(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => documentVersion.versionId, { onDelete: "cascade" }),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => contentNode.nodeId, { onDelete: "cascade" }),
    // Initiation Design's `evidence_text`
    originalText: text("original_text").notNull(),
    // Detailed Design original — normalized form for search.
    normalizedText: text("normalized_text"),
    // page / coordinates / URL / article number
    locatorJson: jsonb("locator_json").notNull(),
    // §4-4 — A~F, derived/denormalized from `document.authority_type`.
    evidenceGrade: char("evidence_grade", { length: 1 }).notNull(),
    citationLabel: varchar("citation_label", { length: 200 }),
    embeddingVersion: varchar("embedding_version", { length: 50 }),
    // Half-precision embedding vector; populated asynchronously (see indexStatus).
    evidenceEmbedding: halfvec("evidence_embedding", {
      dimensions: EVIDENCE_EMBEDDING_DIMENSIONS,
    }),
    indexStatus: indexStatusEnum("index_status").notNull().default("PENDING"),
    ...auditColumns,
  },
  (t) => [
    index("source_evidence_version_id_idx").on(t.versionId),
    index("source_evidence_node_id_idx").on(t.nodeId),
    index("source_evidence_evidence_grade_idx").on(t.evidenceGrade),
    index("source_evidence_index_status_idx").on(t.indexStatus),
    // HNSW ANN index over the cosine distance. The operator class
    // (halfvec_cosine_ops) is patched into the migration SQL by hand because
    // drizzle-kit strips it from generated DDL (drizzle-orm issue #5792).
    index("source_evidence_embedding_hnsw")
      .using("hnsw", t.evidenceEmbedding.op("halfvec_cosine_ops")),
  ],
);
