import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireApproved } from "@/lib/guards/member.guard";
import { searchDocuments } from "@/lib/documents/search";
import { DOC_PERIODS, DOC_SORTS, type DocPeriod, type DocSort } from "@/lib/documents/types";

import { HttpStatus } from "@/constants/http-status.constant";

const MAX_PAGE_SIZE = 50;

// Comma-separated list param -> trimmed non-empty values.
const list = (v: string | null): string[] =>
  v
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

// GET /api/documents — server-side faceted search over the PUBLIC corpus.
// Query: q, types, regions (csv), period, sort, page, pageSize.
// Approved members only (admins bypass).
export async function GET(req: Request) {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { error } = await requireApproved();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") as DocPeriod | null;
    const sort = searchParams.get("sort") as DocSort | null;
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("pageSize")) || 8));

    const result = await searchDocuments({
      q: searchParams.get("q") ?? "",
      types: list(searchParams.get("types")),
      regions: list(searchParams.get("regions")),
      period: period && DOC_PERIODS.includes(period) ? period : "all",
      sort: sort && DOC_SORTS.includes(sort) ? sort : "date",
      page: Math.max(1, Number(searchParams.get("page")) || 1),
      pageSize,
    });

    return apiResponse({ data: result, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error searching documents:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to search documents",
    });
  }
}
