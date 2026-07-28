import { pgTable, varchar } from "drizzle-orm/pg-core";

// Base columns
import { baseColumns } from "../base";

export const profiles = pgTable("profiles", {
  ...baseColumns,
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  imageUrl: varchar("image_url", { length: 255 }),
});
