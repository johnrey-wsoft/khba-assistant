import {
  pgTable,
  uuid,
  text,
  jsonb,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// Audit columns (created/updated/deleted)
import { auditColumns } from "../base";
import { documentVersion } from "./document-version.schema";
import { chunkTypeEnum } from "./enums";

// WS-1267 §6-3 — `content_node`: the document hierarchy
// (articles/clauses/items, tables, and the 4-part case structure).
export const contentNode = pgTable(
  "content_node",
  {
    nodeId: uuid("node_id").primaryKey().defaultRandom(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => documentVersion.versionId, { onDelete: "cascade" }),
    // Self-referential hierarchy (article -> clause, case -> 4 parts).
    parentNodeId: uuid("parent_node_id").references(
      (): AnyPgColumn => contentNode.nodeId,
      { onDelete: "cascade" },
    ),
    // Same notation as the Initiation Design's `article_path` (제3조/제1항).
    nodePath: text("node_path").notNull(),
    chunkType: chunkTypeEnum("chunk_type").notNull(),
    // §6-2 — tables/calc baselines stored separately as rows/columns.
    tableData: jsonb("table_data"),
    ...auditColumns,
  },
  (t) => [
    index("content_node_version_id_idx").on(t.versionId),
    index("content_node_parent_node_id_idx").on(t.parentNodeId),
    index("content_node_node_path_idx").on(t.nodePath),
    index("content_node_chunk_type_idx").on(t.chunkType),
  ],
);
