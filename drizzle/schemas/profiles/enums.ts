import { pgEnum } from "drizzle-orm/pg-core";

// RBAC access role. Distinct from the onboarding `role` on profiles, which is
// the member's professional function (owner/planning/design/...). Keep the
// values in sync with ACCESS_ROLES in constants/access-role.constant.ts.
export const accessRoleEnum = pgEnum("access_role", ["admin", "member"]);
