import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireAdmin } from "@/lib/guards/role.guard";
import { listMembers } from "@/lib/admin/members";

import { HttpStatus } from "@/constants/http-status.constant";

// GET /api/admin/users — all members (admin only) for the management table.
export async function GET() {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { error } = await requireAdmin();
    if (error) return error;

    const data = await listMembers();
    return apiResponse({ data, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error listing members:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to list members",
    });
  }
}
