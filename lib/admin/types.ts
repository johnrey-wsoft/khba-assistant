import type { SelectProfile } from "@/types/drizzle.types";
import type { AccessRole } from "@/constants/access-role.constant";
import type { VerificationStatus } from "@/constants/verification-status.constant";

// The member fields the admin user-management table shows.
export type AdminMember = Pick<
  SelectProfile,
  "id" | "name" | "email" | "company" | "accessRole" | "verificationStatus" | "createdAt"
>;

// What an admin may change on a member.
export type AdminMemberPatch = {
  verificationStatus?: VerificationStatus;
  accessRole?: AccessRole;
};

// --- Document pipeline console -------------------------------------------

// Derived processing status for a document (the DB tracks evidence index state,
// not a per-document run status — this rolls it up).
export type DocumentStatus = "completed" | "waiting" | "failed";

// One row in the admin document-pipeline table (document + its latest version).
export type AdminDocument = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  securityClass: string;
  active: boolean; // deleted_at IS NULL
  versionNo: number | null;
  effectiveFrom: string | null;
  approvalStatus: string | null;
  indexedCount: number;
  status: DocumentStatus;
  createdAt: string | null;
};

// Editable document metadata.
export type AdminDocumentPatch = {
  title?: string;
  authorityType?: string;
  securityClass?: string;
  effectiveFrom?: string | null;
  active?: boolean;
};
