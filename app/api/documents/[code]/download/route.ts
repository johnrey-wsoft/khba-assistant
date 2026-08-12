import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";

import { document, documentVersion } from "@/drizzle/schemas";
import { db } from "@/lib/drizzle/db";
import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireAuth } from "@/lib/guards/auth.guard";
import { isR2Configured, getSignedDownloadUrl } from "@/lib/storage/r2";
import { HttpStatus } from "@/constants/http-status.constant";

// Redirect to a short-lived presigned R2 URL for the raw source file of the
// latest PUBLIC version of a document. Members only. 404s when the document
// has no R2 object (e.g. ingested before R2 was configured).
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const inline = new URL(req.url).searchParams.get("inline") === "1";

  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { error } = await requireAuth();
    if (error) return error;

    if (!isR2Configured()) {
      return apiResponse({ status: HttpStatus.NOT_FOUND, message: "File storage not configured" });
    }

    const [row] = await db
      .select({
        rawObjectPath: documentVersion.rawObjectPath,
        originalFilename: documentVersion.originalFilename,
        storageBucket: documentVersion.storageBucket,
      })
      .from(documentVersion)
      .innerJoin(document, eq(document.documentId, documentVersion.documentId))
      .where(
        and(
          eq(document.documentCode, code),
          eq(document.securityClass, "PUBLIC"),
          isNull(document.deletedAt)
        )
      )
      .orderBy(desc(documentVersion.versionNo))
      .limit(1);

    // storageBucket is only set once the raw file was uploaded to R2.
    if (!row?.storageBucket || !row.rawObjectPath) {
      return apiResponse({ status: HttpStatus.NOT_FOUND, message: "Original file not available" });
    }

    const url = await getSignedDownloadUrl(row.rawObjectPath, {
      filename: row.originalFilename ?? undefined,
      disposition: inline ? "inline" : "attachment",
      expiresIn: 300,
    });

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[documents/download] failed:", error);
    return apiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: "Download failed" });
  }
}
