import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireAdmin } from "@/lib/guards/role.guard";
import { searchAdminDocuments } from "@/lib/admin/documents";
import type { AdminDocsStatusFilter } from "@/lib/admin/types";

import { HttpStatus } from "@/constants/http-status.constant";

const STATUSES: AdminDocsStatusFilter[] = ["all", "completed", "waiting", "failed"];
const MAX_PAGE_SIZE = 50;

// GET /api/admin/documents — server-side paginated document list for the admin
// pipeline console: a page of documents (filtered by derived status), the total
// for pagination, and global stat-tile counts. Admin only.
export async function GET(req: Request) {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as AdminDocsStatusFilter | null;
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("pageSize")) || 8));

    const data = await searchAdminDocuments({
      status: status && STATUSES.includes(status) ? status : "all",
      page: Math.max(1, Number(searchParams.get("page")) || 1),
      pageSize,
    });

    return apiResponse({ data, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error listing documents:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to list documents",
    });
  }
}
