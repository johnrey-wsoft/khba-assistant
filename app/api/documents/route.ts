import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireApproved } from "@/lib/guards/member.guard";
import { listSearchableDocuments } from "@/lib/documents/search";

import { HttpStatus } from "@/constants/http-status.constant";

// GET /api/documents — the browsable PUBLIC corpus for faceted search.
// Approved members only (admins bypass).
export async function GET() {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { error } = await requireApproved();
    if (error) return error;

    const documents = await listSearchableDocuments();
    return apiResponse({ data: documents, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error listing documents:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to list documents",
    });
  }
}
