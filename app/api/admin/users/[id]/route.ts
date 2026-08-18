import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireAdmin } from "@/lib/guards/role.guard";
import { updateMember } from "@/lib/admin/members";
import type { AdminMemberPatch } from "@/lib/admin/types";

import { HttpStatus } from "@/constants/http-status.constant";
import { ACCESS_ROLES } from "@/constants/access-role.constant";
import { VERIFICATION_STATUSES } from "@/constants/verification-status.constant";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/admin/users/[id] — change a member's verification status and/or
// access role. Admin only.
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { user, error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as AdminMemberPatch;

    const patch: AdminMemberPatch = {};

    if (body.verificationStatus !== undefined) {
      if (!VERIFICATION_STATUSES.includes(body.verificationStatus)) {
        return apiResponse({
          status: HttpStatus.BAD_REQUEST,
          message: "Invalid verificationStatus",
        });
      }
      patch.verificationStatus = body.verificationStatus;
    }

    if (body.accessRole !== undefined) {
      if (!ACCESS_ROLES.includes(body.accessRole)) {
        return apiResponse({ status: HttpStatus.BAD_REQUEST, message: "Invalid accessRole" });
      }
      // Self-protection: an admin can't change their own access role (avoids
      // accidentally locking themselves out of the admin area).
      if (id === user!.id) {
        return apiResponse({
          status: HttpStatus.BAD_REQUEST,
          message: "You can't change your own access role",
        });
      }
      patch.accessRole = body.accessRole;
    }

    if (Object.keys(patch).length === 0) {
      return apiResponse({ status: HttpStatus.BAD_REQUEST, message: "Nothing to update" });
    }

    const updated = await updateMember(id, patch);
    if (!updated) return apiResponse({ status: HttpStatus.NOT_FOUND });

    return apiResponse({ data: updated, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error updating member:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to update member",
    });
  }
}
