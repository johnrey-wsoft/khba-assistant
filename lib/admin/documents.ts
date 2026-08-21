import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/drizzle/db";
import { document, documentVersion } from "@/drizzle/schemas";
import { isR2Configured, deleteObject } from "@/lib/storage/r2";
import type {
  AdminDocsParams,
  AdminDocsResult,
  AdminDocument,
  AdminDocumentPatch,
} from "@/lib/admin/types";

// Per-document projection: latest version + indexed/failed evidence counts, plus
// the rolled-up processing status (failed > completed > waiting). Reused by the
// stats, count, and page queries below so they always agree.
const DOCS_CTE = sql`
  select
    d.document_code                          as "documentCode",
    d.title                                  as "title",
    d.authority_type                         as "authorityType",
    d.jurisdiction_code                      as "jurisdictionCode",
    d.security_class                         as "securityClass",
    (d.deleted_at is null)                   as "active",
    d.created_at                             as "createdAt",
    v.version_no                             as "versionNo",
    v.effective_from                         as "effectiveFrom",
    v.approval_status                        as "approvalStatus",
    coalesce(ev.indexed, 0)::int             as "indexedCount",
    case
      when coalesce(ev.failed, 0) > 0 then 'failed'
      when coalesce(ev.indexed, 0) > 0 then 'completed'
      when v.version_id is not null then 'waiting'
      else 'failed'
    end                                      as "status"
  from document d
  left join lateral (
    select dv.version_id, dv.version_no, dv.effective_from, dv.approval_status
    from document_version dv
    where dv.document_id = d.document_id
    order by dv.version_no desc nulls last
    limit 1
  ) v on true
  left join lateral (
    select
      count(*) filter (where se.index_status = 'INDEXED') as indexed,
      count(*) filter (where se.index_status = 'FAILED')  as failed
    from source_evidence se
    where se.version_id = v.version_id
  ) ev on true
`;

// Server-side, paginated document list for the pipeline console. Returns the
// page of documents matching the status filter, the total for pagination, and
// global stat-tile counts (over every document, independent of the filter/page).
export const searchAdminDocuments = async (params: AdminDocsParams): Promise<AdminDocsResult> => {
  const { status, pageSize } = params;
  const where = status === "all" ? sql`` : sql`where "status" = ${status}`;

  const [statsRows, totalRows] = (await Promise.all([
    db.execute(sql`
      with docs as (${DOCS_CTE})
      select
        count(*)::int                                   as "total",
        count(*) filter (where "status" = 'completed')::int as "completed",
        count(*) filter (where "status" = 'waiting')::int   as "waiting",
        count(*) filter (where "status" = 'failed')::int    as "failed",
        coalesce(sum("indexedCount"), 0)::int           as "evidence"
      from docs
    `),
    db.execute(sql`with docs as (${DOCS_CTE}) select count(*)::int as "n" from docs ${where}`),
  ])) as unknown as [
    { total: number; completed: number; waiting: number; failed: number; evidence: number }[],
    { n: number }[],
  ];

  const stats = statsRows[0] ?? { total: 0, completed: 0, waiting: 0, failed: 0, evidence: 0 };
  const total = totalRows[0]?.n ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page), pageCount);
  const offset = (page - 1) * pageSize;

  const items = (await db.execute(sql`
    with docs as (${DOCS_CTE})
    select * from docs ${where}
    order by "createdAt" desc nulls last
    limit ${pageSize} offset ${offset}
  `)) as unknown as AdminDocument[];

  return { items: items as AdminDocument[], total, page, pageCount, stats };
};

// Update a document's metadata. `active` toggles the soft-delete flag;
// `effectiveFrom` writes to the latest version. Returns false if not found.
export const updateDocument = async (code: string, patch: AdminDocumentPatch): Promise<boolean> => {
  const [doc] = await db
    .select({ id: document.documentId })
    .from(document)
    .where(eq(document.documentCode, code))
    .limit(1);
  if (!doc) return false;

  const docSet: Record<string, unknown> = {};
  if (patch.title !== undefined) docSet.title = patch.title;
  if (patch.authorityType !== undefined) docSet.authorityType = patch.authorityType;
  if (patch.securityClass !== undefined) docSet.securityClass = patch.securityClass;
  if (patch.active !== undefined) docSet.deletedAt = patch.active ? null : new Date();

  if (Object.keys(docSet).length > 0) {
    docSet.updatedAt = new Date();
    await db.update(document).set(docSet).where(eq(document.documentId, doc.id));
  }

  if (patch.effectiveFrom !== undefined) {
    // Write to the latest version.
    const [latest] = await db
      .select({ id: documentVersion.versionId })
      .from(documentVersion)
      .where(eq(documentVersion.documentId, doc.id))
      .orderBy(desc(documentVersion.versionNo))
      .limit(1);
    if (latest) {
      await db
        .update(documentVersion)
        .set({ effectiveFrom: patch.effectiveFrom, updatedAt: new Date() })
        .where(eq(documentVersion.versionId, latest.id));
    }
  }

  return true;
};

// Permanently delete a document and everything under it. The document_version,
// content_node, source_evidence (with embeddings), and document_topic_tag rows
// are removed by ON DELETE CASCADE. Stored raw files are best-effort deleted
// from R2 first. Returns false if the code doesn't exist.
export const deleteDocument = async (code: string): Promise<boolean> => {
  const [doc] = await db
    .select({ id: document.documentId })
    .from(document)
    .where(eq(document.documentCode, code))
    .limit(1);
  if (!doc) return false;

  if (isR2Configured()) {
    const versions = await db
      .select({ path: documentVersion.rawObjectPath })
      .from(documentVersion)
      .where(eq(documentVersion.documentId, doc.id));
    await Promise.all(
      versions.map((v) => (v.path ? deleteObject(v.path).catch(() => {}) : Promise.resolve()))
    );
  }

  await db.delete(document).where(eq(document.documentId, doc.id));
  return true;
};
