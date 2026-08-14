import type { SelectProfile } from "@/types/drizzle.types";

// RBAC access roles. The AccessRole type is derived from the `access_role`
// column, so this stays in lockstep with the Drizzle enum; the `satisfies`
// below fails to compile if ACCESS_ROLES ever drifts from the schema.
export type AccessRole = NonNullable<SelectProfile["accessRole"]>;

export const ACCESS_ROLES = ["admin", "member"] as const satisfies readonly AccessRole[];

export const DEFAULT_ACCESS_ROLE: AccessRole = "member";

export const isAdminRole = (role: AccessRole | null | undefined): boolean => role === "admin";
