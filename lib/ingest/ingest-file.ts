import "server-only";

import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash, randomUUID } from "node:crypto";

import { db } from "@/lib/drizzle/db";
import { parseDocument } from "@/lib/ingest/parse";
import { semanticChunk } from "@/lib/ai/chunking";
import { embedTexts } from "@/lib/ai/embeddings";
import { upsertDocuments } from "@/lib/ingest/upsert";
import {
  isR2Configured,
  buildRawObjectKey,
  contentTypeFor,
  uploadRawObject,
} from "@/lib/storage/r2";

export type UploadMeta = {
  title: string;
  authorityType: string;
  securityClass: string;
  jurisdictionCode: string | null;
  effectiveFrom: string | null;
};

export type IngestResult = {
  documentCode: string;
  evidence: number;
  chars: number;
  chunks: number;
};

// A generated, human-scannable code for admin-uploaded documents.
const generateCode = () => `UP-${randomUUID().slice(0, 8).toUpperCase()}`;

// Run the full ingest pipeline (parse -> chunk -> embed -> R2 -> upsert) for an
// uploaded file's bytes, mirroring scripts/ingest.ts but from an upload instead
// of the manifest. parseDocument needs a path, so the bytes are staged in a
// temp file (its extension routes the parser: .hwp -> pyhwp, .hwpx -> Upstage,
// else MarkItDown).
export const ingestUploadedFile = async (
  fileName: string,
  bytes: Buffer,
  meta: UploadMeta
): Promise<IngestResult> => {
  const documentCode = generateCode();
  const versionNo = 1;
  const ext = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : "";
  const tmpPath = join(tmpdir(), `khba-upload-${randomUUID()}${ext}`);

  try {
    await writeFile(tmpPath, bytes);
    const sourceHash = createHash("sha256").update(bytes).digest("hex");
    const contentType = contentTypeFor(fileName);

    let stored: Awaited<ReturnType<typeof uploadRawObject>> | null = null;
    if (isR2Configured()) {
      const key = buildRawObjectKey(documentCode, versionNo, fileName);
      stored = await uploadRawObject({ key, body: bytes, contentType });
    }

    const markdown = await parseDocument(tmpPath);
    const chunks = await semanticChunk(markdown);
    const embeddings = chunks.length > 0 ? await embedTexts(chunks) : [];

    const evidence = await upsertDocuments(db, [
      {
        documentCode,
        title: meta.title,
        authorityType: meta.authorityType,
        jurisdictionCode: meta.jurisdictionCode,
        securityClass: meta.securityClass,
        version: {
          versionNo,
          effectiveFrom: meta.effectiveFrom,
          rawObjectPath: stored?.key ?? fileName,
          sourceHash,
          storageBucket: stored?.bucket ?? null,
          contentType: stored?.contentType ?? contentType,
          sizeBytes: stored?.sizeBytes ?? bytes.byteLength,
          originalFilename: fileName,
          etag: stored?.etag ?? null,
          uploadedAt: stored ? new Date() : null,
        },
        chunks: chunks.map((text, i) => ({ text, embedding: embeddings[i] })),
      },
    ]);

    return { documentCode, evidence, chars: markdown.length, chunks: chunks.length };
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
};
