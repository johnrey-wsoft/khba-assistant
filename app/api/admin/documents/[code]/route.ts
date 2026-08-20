import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireAdmin } from "@/lib/guards/role.guard";
import { updateDocument, deleteDocument } from "@/lib/admin/documents";
import type { AdminDocumentPatch } from "@/lib/admin/types";

import { HttpStatus } from "@/constants/http-status.constant";

const AUTHORITY_TYPES = [
  "LAW",
  "ORDINANCE",
  "ADMIN_RULE",
  "INTERPRETATION",
  "ASSOCIATION_GUIDE",
  "MEMBER_CASE",
];
const SECURITY_CLASSES = ["PUBLIC", "INTERNAL", "CONFIDENTIAL"];

type RouteContext = { params: Promise<{ code: string }> };

// PATCH /api/admin/documents/[code] — edit document metadata. Admin only.
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { error } = await requireAdmin();
    if (error) return error;

    const { code } = await params;
    const body = (await req.json().catch(() => ({}))) as AdminDocumentPatch;

    const patch: AdminDocumentPatch = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return apiResponse({ status: HttpStatus.BAD_REQUEST, message: "title is required" });
      }
      patch.title = body.title.trim();
    }
    if (body.authorityType !== undefined) {
      if (!AUTHORITY_TYPES.includes(body.authorityType)) {
        return apiResponse({ status: HttpStatus.BAD_REQUEST, message: "Invalid authorityType" });
      }
      patch.authorityType = body.authorityType;
    }
    if (body.securityClass !== undefined) {
      if (!SECURITY_CLASSES.includes(body.securityClass)) {
        return apiResponse({ status: HttpStatus.BAD_REQUEST, message: "Invalid securityClass" });
      }
      patch.securityClass = body.securityClass;
    }
    if (body.effectiveFrom !== undefined) patch.effectiveFrom = body.effectiveFrom || null;
    if (body.active !== undefined) patch.active = Boolean(body.active);

    if (Object.keys(patch).length === 0) {
      return apiResponse({ status: HttpStatus.BAD_REQUEST, message: "Nothing to update" });
    }

    const ok = await updateDocument(code, patch);
    if (!ok) return apiResponse({ status: HttpStatus.NOT_FOUND });

    return apiResponse({ data: { code, ...patch }, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error updating document:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to update document",
    });
  }
}

// DELETE /api/admin/documents/[code] — permanently delete a document and all
// its versions, content, evidence, and stored files. Admin only.
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { error } = await requireAdmin();
    if (error) return error;

    const { code } = await params;
    const ok = await deleteDocument(code);
    if (!ok) return apiResponse({ status: HttpStatus.NOT_FOUND });

    return apiResponse({ data: { code }, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error deleting document:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to delete document",
    });
  }
}
