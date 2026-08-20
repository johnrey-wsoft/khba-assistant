import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/lib/drizzle/db";
import type { SearchDocument } from "@/lib/documents/types";

// Every PUBLIC, non-deleted document that has a version, with its latest
// version's base date and a lead passage for the result snippet. Newest first.
// This is the browsable corpus for the faceted search page; filtering, sorting
// and text matching happen client-side over this set (mirrors the prototype).
export const listSearchableDocuments = async (): Promise<SearchDocument[]> => {
  const rows = (await db.execute(sql`
    select
      d.document_code       as "documentCode",
      d.title               as "title",
      d.authority_type      as "authorityType",
      d.jurisdiction_code   as "jurisdictionCode",
      v.effective_from      as "effectiveFrom",
      s.snippet             as "snippet"
    from document d
    left join lateral (
      select dv.version_id, dv.version_no, dv.effective_from
      from document_version dv
      where dv.document_id = d.document_id
      order by dv.version_no desc nulls last
      limit 1
    ) v on true
    left join lateral (
      select se.original_text as snippet
      from source_evidence se
      where se.version_id = v.version_id
        and se.index_status = 'INDEXED'
      order by se.created_at asc nulls last
      limit 1
    ) s on true
    where d.security_class = 'PUBLIC'
      and d.deleted_at is null
      and v.version_id is not null
    order by v.effective_from desc nulls last, d.created_at desc nulls last
  `)) as unknown as SearchDocument[];

  return rows;
};
