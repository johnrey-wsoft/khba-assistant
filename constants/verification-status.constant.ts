import type { SelectProfile } from "@/types/drizzle.types";

// Association-desk verification status. The type is derived from the
// `verification_status` column so it stays in lockstep with the Drizzle enum;
// the `satisfies` below fails to compile if the list drifts from the schema.
export type VerificationStatus = NonNullable<SelectProfile["verificationStatus"]>;

export const VERIFICATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const satisfies readonly VerificationStatus[];

export const DEFAULT_VERIFICATION_STATUS: VerificationStatus = "pending";

export const isApproved = (status: VerificationStatus | null | undefined): boolean =>
  status === "approved";
