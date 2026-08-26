import { apiResponse } from "@/lib/response";
import { requireAdmin } from "@/lib/guards/role.guard";
import { ingestUploadedFile } from "@/lib/ingest/ingest-file";

import { HttpStatus } from "@/constants/http-status.constant";

export const runtime = "nodejs";
// Parse + embed can take a while for a large document.
export const maxDuration = 120;

// Formats the pipeline can parse (MarkItDown for most, Java hwp-api for .hwp/.hwpx).
const ALLOWED_EXT = new Set([
  ".pdf",
  ".docx",
  ".doc",
  ".xlsx",
  ".xls",
  ".pptx",
  ".ppt",
  ".hwp",
  ".hwpx",
  ".png",
  ".jpg",
  ".jpeg",
  ".csv",
  ".txt",
  ".html",
  ".json",
]);

// POST /api/admin/documents/upload — upload a file and ingest it into the
// pipeline (new document, defaults for metadata; edit it afterwards). Admin only.
export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return apiResponse({ status: HttpStatus.BAD_REQUEST, message: "file is required" });
    }

    const name = file.name || "upload";
    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase() : "";
    if (!ALLOWED_EXT.has(ext)) {
      return apiResponse({
        status: HttpStatus.BAD_REQUEST,
        message: `Unsupported file type: ${ext}`,
      });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const titleInput = formData.get("title");
    const title =
      (typeof titleInput === "string" && titleInput.trim()) || name.replace(/\.[^.]+$/, "");

    const result = await ingestUploadedFile(name, bytes, {
      title,
      authorityType: "ASSOCIATION_GUIDE", // sensible default; admin edits after
      securityClass: "PUBLIC",
      jurisdictionCode: null,
      effectiveFrom: null,
    });

    return apiResponse({ data: result, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error ingesting upload:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: error instanceof Error ? error.message : "Upload failed",
    });
  }
}
