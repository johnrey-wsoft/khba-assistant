import { pgTable, uuid, varchar, index, primaryKey } from "drizzle-orm/pg-core";

import { document } from "./document.schema";

// WS-1267 §5-1 / §6-5 — `document_topic_tag`: business tags as a many-to-many
// join table (kept from the Initiation Design; absent in the Detailed Design).
export const documentTopicTag = pgTable(
  "document_topic_tag",
  {
    documentId: uuid("document_id")
      .notNull()
      .references(() => document.documentId, { onDelete: "cascade" }),
    tag: varchar("tag", { length: 50 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.documentId, t.tag] }),
    index("document_topic_tag_tag_idx").on(t.tag),
  ],
);
