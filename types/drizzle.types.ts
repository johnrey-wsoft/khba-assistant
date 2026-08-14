import * as schema from "@/drizzle/schemas";

export type SelectProfile = typeof schema.profiles.$inferSelect;
export type InsertProfile = typeof schema.profiles.$inferInsert;

// Chat & message persistence
export type SelectChat = typeof schema.chats.$inferSelect;
export type InsertChat = typeof schema.chats.$inferInsert;

export type SelectMessage = typeof schema.messages.$inferSelect;
export type InsertMessage = typeof schema.messages.$inferInsert;

// WS-1267 — Document & Evidence Data Standard Schema
export type SelectDocument = typeof schema.document.$inferSelect;
export type InsertDocument = typeof schema.document.$inferInsert;

export type SelectDocumentVersion = typeof schema.documentVersion.$inferSelect;
export type InsertDocumentVersion = typeof schema.documentVersion.$inferInsert;

export type SelectContentNode = typeof schema.contentNode.$inferSelect;
export type InsertContentNode = typeof schema.contentNode.$inferInsert;

export type SelectSourceEvidence = typeof schema.sourceEvidence.$inferSelect;
export type InsertSourceEvidence = typeof schema.sourceEvidence.$inferInsert;

export type SelectDocumentTopicTag = typeof schema.documentTopicTag.$inferSelect;
export type InsertDocumentTopicTag = typeof schema.documentTopicTag.$inferInsert;
