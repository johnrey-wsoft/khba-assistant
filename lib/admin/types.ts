import type { SelectProfile } from "@/types/drizzle.types";
import type { AccessRole } from "@/constants/access-role.constant";
import type { VerificationStatus } from "@/constants/verification-status.constant";

// The member fields the admin user-management table shows.
export type AdminMember = Pick<
  SelectProfile,
  | "id"
  | "name"
  | "email"
  | "company"
  | "businessRegistrationNumber"
  | "memberNumber"
  | "role"
  | "accessRole"
  | "verificationStatus"
  | "createdAt"
>;

// What an admin may change on a member.
export type AdminMemberPatch = {
  verificationStatus?: VerificationStatus;
  accessRole?: AccessRole;
};
