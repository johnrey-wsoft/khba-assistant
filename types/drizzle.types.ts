import * as schema from "@/drizzle/schemas";

export type SelectProfile = typeof schema.profiles.$inferSelect;
export type InsertProfile = typeof schema.profiles.$inferInsert;
