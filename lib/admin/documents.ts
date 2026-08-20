import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/drizzle/db";
import { document, documentVersion } from "@/drizzle/schemas";
import type { AdminDocument, AdminDocumentPatch, DocumentStatus } from "@/lib/admin/types";

type DocRow = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  securityClass: string;
  active: boolean;
  versionNo: number | null;
  effectiveFrom: string | null;
  approvalStatus: string | null;
  indexedCount: number;
  failedCount: number;
  createdAt: string | null;
};

const deriveStatus = (r: DocRow): DocumentStatus => {
  if (r.failedCount > 0) return "failed";
  if (r.indexedCount > 0) return "completed";
  if (r.versionNo != null) return "waiting"; // has a version but nothing indexed yet
  return "failed"; // no version was ever produced
};

// All documents with their latest version + indexed/failed evidence counts,
// newest first. Derives a rolled-up processing status per document.
export const listDocuments = async (): Promise<AdminDocument[]> => {
  const rows = (await db.execute(sql`
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
      coalesce(ev.failed, 0)::int              as "failedCount"
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
    order by d.created_at desc nulls last
  `)) as unknown as DocRow[];

  return rows.map((r) => ({
    documentCode: r.documentCode,
    title: r.title,
    authorityType: r.authorityType,
    jurisdictionCode: r.jurisdictionCode,
    securityClass: r.securityClass,
    active: r.active,
    versionNo: r.versionNo,
    effectiveFrom: r.effectiveFrom,
    approvalStatus: r.approvalStatus,
    indexedCount: r.indexedCount,
    status: deriveStatus(r),
    createdAt: r.createdAt,
  }));
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
