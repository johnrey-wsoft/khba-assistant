import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireAdmin } from "@/lib/guards/role.guard";
import { listDocuments } from "@/lib/admin/documents";

import { HttpStatus } from "@/constants/http-status.constant";

// GET /api/admin/documents — all documents with latest version + derived
// processing status, for the admin pipeline console. Admin only.
export async function GET() {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { error } = await requireAdmin();
    if (error) return error;

    const data = await listDocuments();
    return apiResponse({ data, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error listing documents:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to list documents",
    });
  }
}
