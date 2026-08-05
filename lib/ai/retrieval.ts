import { sql } from "drizzle-orm";

import { db } from "@/lib/drizzle/db";
import { embedText, EMBEDDING_DIMENSIONS } from "./embeddings";

export type RetrievedSource = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  securityClass: string;
  snippet: string;
  similarity: number;
};

type Row = Omit<RetrievedSource, "similarity"> & { similarity: string | number };

// Semantic retrieval over source_evidence via pgvector cosine distance.
// PUBLIC + INDEXED only (this is an unauthenticated endpoint). Returns one
// result per document (best-matching passage), ranked by similarity.
export const semanticSearchKhba = async (query: string, limit = 5): Promise<RetrievedSource[]> => {
  const embedding = await embedText(query);
  const vector = `[${embedding.join(",")}]`;
  const dims = sql.raw(String(EMBEDDING_DIMENSIONS));

  // Over-fetch so we can dedupe to distinct documents while keeping the best
  // passage per document.
  const rows = (await db.execute(sql`
    SELECT d.document_code       AS "documentCode",
           d.title               AS "title",
           d.authority_type      AS "authorityType",
           d.jurisdiction_code   AS "jurisdictionCode",
           d.security_class      AS "securityClass",
           se.original_text      AS "snippet",
           1 - (se.evidence_embedding <=> ${vector}::halfvec(${dims})) AS "similarity"
    FROM source_evidence se
    JOIN document_version dv ON dv.version_id = se.version_id
    JOIN document d ON d.document_id = dv.document_id
    WHERE d.security_class = 'PUBLIC'
      AND d.deleted_at IS NULL
      AND se.index_status = 'INDEXED'
      AND se.evidence_embedding IS NOT NULL
    ORDER BY se.evidence_embedding <=> ${vector}::halfvec(${dims})
    LIMIT ${limit * 4}
  `)) as unknown as Row[];

  const seen = new Set<string>();
  const results: RetrievedSource[] = [];
  for (const row of rows) {
    if (seen.has(row.documentCode)) continue;
    seen.add(row.documentCode);
    results.push({ ...row, similarity: Number(row.similarity) });
    if (results.length >= limit) break;
  }
  return results;
};

export type DocumentPassage = { nodePath: string; text: string };

export type FullDocument = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  securityClass: string;
  effectiveFrom: string | null;
  passages: DocumentPassage[];
};

type DocRow = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  securityClass: string;
  effectiveFrom: string | null;
  nodePath: string;
  text: string;
};

// Full document (all passages of its latest version), PUBLIC only. Powers the
// source panel's "full document" view.
export const getDocumentByCode = async (code: string): Promise<FullDocument | null> => {
  const rows = (await db.execute(sql`
    SELECT d.document_code     AS "documentCode",
           d.title             AS "title",
           d.authority_type    AS "authorityType",
           d.jurisdiction_code AS "jurisdictionCode",
           d.security_class    AS "securityClass",
           dv.effective_from   AS "effectiveFrom",
           cn.node_path        AS "nodePath",
           se.original_text    AS "text",
           (se.locator_json->>'chunkIndex')::int AS "chunkIndex"
    FROM document d
    JOIN document_version dv ON dv.document_id = d.document_id
    JOIN source_evidence se ON se.version_id = dv.version_id
    JOIN content_node cn ON cn.node_id = se.node_id
    WHERE d.document_code = ${code}
      AND d.security_class = 'PUBLIC'
      AND d.deleted_at IS NULL
      AND dv.version_no = (
        SELECT max(version_no) FROM document_version WHERE document_id = d.document_id
      )
    ORDER BY "chunkIndex" NULLS LAST, cn.node_path
  `)) as unknown as DocRow[];

  if (rows.length === 0) return null;

  const [first] = rows;
  return {
    documentCode: first.documentCode,
    title: first.title,
    authorityType: first.authorityType,
    jurisdictionCode: first.jurisdictionCode,
    securityClass: first.securityClass,
    effectiveFrom: first.effectiveFrom,
    passages: rows.map((r) => ({ nodePath: r.nodePath, text: r.text })),
  };
};
