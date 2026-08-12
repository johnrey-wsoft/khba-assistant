import { pgTable, varchar, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

// Base columns
import { baseColumns } from "../base";

export const profiles = pgTable("profiles", {
  ...baseColumns,
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  imageUrl: varchar("image_url", { length: 255 }),

  // --- Member onboarding ---------------------------------------------------
  // Collected after sign-up on /onboarding. All optional / defaulted so the
  // Supabase profile-creation trigger (which sets only id/email/name) keeps
  // working without change.
  company: varchar("company", { length: 200 }),
  businessRegistrationNumber: varchar("business_registration_number", { length: 20 }),
  memberNumber: varchar("member_number", { length: 50 }),
  role: varchar("role", { length: 50 }),
  topics: jsonb("topics").$type<string[]>().default([]),
  marketingOptIn: boolean("marketing_opt_in").default(false).notNull(),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  termsVersion: varchar("terms_version", { length: 20 }),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
});
