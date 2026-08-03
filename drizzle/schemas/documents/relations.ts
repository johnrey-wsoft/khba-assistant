import { relations } from "drizzle-orm";

import { document } from "./document.schema";
import { documentVersion } from "./document-version.schema";
import { contentNode } from "./content-node.schema";
import { sourceEvidence } from "./source-evidence.schema";
import { documentTopicTag } from "./document-topic-tag.schema";

// WS-1267 §21 ERD — document -> version -> node -> evidence.
export const documentRelations = relations(document, ({ many }) => ({
  versions: many(documentVersion),
  topicTags: many(documentTopicTag),
}));

export const documentVersionRelations = relations(
  documentVersion,
  ({ one, many }) => ({
    document: one(document, {
      fields: [documentVersion.documentId],
      references: [document.documentId],
    }),
    nodes: many(contentNode),
    evidence: many(sourceEvidence),
  }),
);

export const contentNodeRelations = relations(
  contentNode,
  ({ one, many }) => ({
    version: one(documentVersion, {
      fields: [contentNode.versionId],
      references: [documentVersion.versionId],
    }),
    parent: one(contentNode, {
      fields: [contentNode.parentNodeId],
      references: [contentNode.nodeId],
      relationName: "node_hierarchy",
    }),
    children: many(contentNode, { relationName: "node_hierarchy" }),
    evidence: many(sourceEvidence),
  }),
);

export const sourceEvidenceRelations = relations(sourceEvidence, ({ one }) => ({
  version: one(documentVersion, {
    fields: [sourceEvidence.versionId],
    references: [documentVersion.versionId],
  }),
  node: one(contentNode, {
    fields: [sourceEvidence.nodeId],
    references: [contentNode.nodeId],
  }),
}));

export const documentTopicTagRelations = relations(
  documentTopicTag,
  ({ one }) => ({
    document: one(document, {
      fields: [documentTopicTag.documentId],
      references: [document.documentId],
    }),
  }),
);
