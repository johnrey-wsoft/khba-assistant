import { pgEnum } from "drizzle-orm/pg-core";

// RBAC access role. Distinct from the onboarding `role` on profiles, which is
// the member's professional function (owner/planning/design/...). Keep the
// values in sync with ACCESS_ROLES in constants/access-role.constant.ts.
export const accessRoleEnum = pgEnum("access_role", ["admin", "member"]);

// Association-desk membership verification. New members are `pending` until the
// desk approves them; `rejected` when declined. Gates access to the app.
// Keep in sync with VERIFICATION_STATUSES in
// constants/verification-status.constant.ts.
export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "approved",
  "rejected",
]);
