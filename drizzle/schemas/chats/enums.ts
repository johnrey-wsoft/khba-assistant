import { pgEnum } from "drizzle-orm/pg-core";

// AI SDK v5 UIMessage roles. Kept as an enum (mirrors the documents module's
// typed enums) so the column is constrained at the DB level.
export const messageRoleEnum = pgEnum("message_role", ["system", "user", "assistant"]);
