import { createHash } from "node:crypto";

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { inArray, sql } from "drizzle-orm";

import { document, documentVersion, contentNode, sourceEvidence } from "../../drizzle/schemas";
import { EMBEDDING_MODEL_ID, EMBEDDING_DIMENSIONS } from "../ai/embeddings";

export type PreparedChunk = { text: string; embedding: number[] };

export type PreparedDocument = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  securityClass: string;
  version: {
    versionNo: number;
    effectiveFrom: string | null;
    // R2 object key when uploaded, else the local manifest path.
    rawObjectPath: string;
    // SHA-256 of the raw file bytes; falls back to a path-derived hash.
    sourceHash?: string;
    // R2 object metadata (set when the raw file is uploaded to R2).
    storageBucket?: string | null;
    contentType?: string | null;
    sizeBytes?: number | null;
    originalFilename?: string | null;
    etag?: string | null;
    uploadedAt?: Date | null;
  };
  chunks: PreparedChunk[];
};

// §4-4 — evidence grade derived from authority type.
const GRADE: Record<string, string> = {
  LAW: "A",
  ORDINANCE: "B",
  ADMIN_RULE: "C",
  INTERPRETATION: "D",
  ASSOCIATION_GUIDE: "E",
  MEMBER_CASE: "F",
};

const CHUNK_TYPE: Record<string, string> = {
  LAW: "LAW_ARTICLE",
  ORDINANCE: "LAW_ARTICLE",
  ADMIN_RULE: "LAW_ARTICLE",
  INTERPRETATION: "LAW_ARTICLE",
  ASSOCIATION_GUIDE: "GUIDE_TOPIC",
  MEMBER_CASE: "CASE_SITUATION",
};

// Idempotent upsert of prepared documents into
// document -> document_version -> content_node -> source_evidence, with the
// halfvec embedding + index_status INDEXED. Deletes prior versions of the same
// documentCode first (cascades). Returns the number of evidence rows written.
export const upsertDocuments = async (
  db: PostgresJsDatabase,
  docs: PreparedDocument[]
): Promise<number> => {
  const codes = docs.map((d) => d.documentCode);
  if (codes.length > 0) {
    await db.delete(document).where(inArray(document.documentCode, codes));
  }

  let evidenceCount = 0;

  for (const doc of docs) {
    const [docRow] = await db
      .insert(document)
      .values({
        documentCode: doc.documentCode,
        title: doc.title,
        authorityType: doc.authorityType as never,
        jurisdictionCode: doc.jurisdictionCode,
        securityClass: doc.securityClass as never,
      })
      .returning({ id: document.documentId });

    const sourceHash =
      doc.version.sourceHash ??
      createHash("sha256").update(`${doc.documentCode}:${doc.version.rawObjectPath}`).digest("hex");

    const [verRow] = await db
      .insert(documentVersion)
      .values({
        documentId: docRow.id,
        versionNo: doc.version.versionNo,
        effectiveFrom: doc.version.effectiveFrom,
        sourceHash,
        rawObjectPath: doc.version.rawObjectPath,
        storageBucket: doc.version.storageBucket ?? null,
        contentType: doc.version.contentType ?? null,
        sizeBytes: doc.version.sizeBytes ?? null,
        originalFilename: doc.version.originalFilename ?? null,
        etag: doc.version.etag ?? null,
        uploadedAt: doc.version.uploadedAt ?? null,
        approvalStatus: "PUBLISHED",
      })
      .returning({ id: documentVersion.versionId });

    for (let i = 0; i < doc.chunks.length; i++) {
      const chunk = doc.chunks[i];
      const nodePath = `${doc.documentCode}#${i + 1}`;

      const [nodeRow] = await db
        .insert(contentNode)
        .values({
          versionId: verRow.id,
          nodePath,
          chunkType: (CHUNK_TYPE[doc.authorityType] ?? "GUIDE_TOPIC") as never,
        })
        .returning({ id: contentNode.nodeId });

      const vectorLiteral = `[${chunk.embedding.join(",")}]`;

      await db.insert(sourceEvidence).values({
        versionId: verRow.id,
        nodeId: nodeRow.id,
        originalText: chunk.text,
        locatorJson: { chunkIndex: i, nodePath },
        evidenceGrade: GRADE[doc.authorityType] ?? "F",
        citationLabel: chunk.text.slice(0, 120),
        embeddingVersion: EMBEDDING_MODEL_ID,
        evidenceEmbedding: sql`${vectorLiteral}::halfvec(${sql.raw(String(EMBEDDING_DIMENSIONS))})`,
        indexStatus: "INDEXED",
      });
      evidenceCount++;
    }
  }

  return evidenceCount;
};
