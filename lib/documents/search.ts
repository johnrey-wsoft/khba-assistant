import "server-only";

import { sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/drizzle/db";
import {
  NATIONWIDE,
  type FacetCount,
  type SearchDocument,
  type SearchParams,
  type SearchResult,
} from "@/lib/documents/types";

// Latest version of a document (lateral). Reused across every query below so
// the base date and passage search agree on which version they mean.
const LATEST_VERSION = sql`
  left join lateral (
    select dv.version_id, dv.effective_from
    from document_version dv
    where dv.document_id = d.document_id
    order by dv.version_no desc nulls last
    limit 1
  ) v on true
`;

// The base predicate: PUBLIC, live, has a version, matches the text query and
// the period. Type/region facet selections are NOT included here — they're
// added only to the result/total queries, so each facet's counts stay stable
// as the user ticks options within it (standard OR-within / AND-across facets).
const buildBase = (q: string, period: SearchParams["period"]): SQL => {
  const conds: SQL[] = [
    sql`d.security_class = 'PUBLIC'`,
    sql`d.deleted_at is null`,
    sql`v.version_id is not null`,
  ];

  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  for (const term of terms) {
    const like = `%${term}%`;
    // Each term must appear in the title or in a passage of the latest version.
    conds.push(sql`(
      d.title ilike ${like}
      or exists (
        select 1 from source_evidence se2
        where se2.version_id = v.version_id and se2.original_text ilike ${like}
      )
    )`);
  }

  if (period === "2026") {
    conds.push(sql`v.effective_from >= '2026-01-01'`);
  } else if (period === "recent") {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    conds.push(sql`v.effective_from >= ${d.toISOString().slice(0, 10)}`);
  }

  return sql.join(conds, sql` and `);
};

// Type + region selections, ANDed onto the base for result/total queries.
const buildSelections = (types: string[], regions: string[]): SQL => {
  const conds: SQL[] = [];
  if (types.length) conds.push(sql`d.authority_type::text = any(${types})`);

  if (regions.length) {
    const codes = regions.filter((r) => r !== NATIONWIDE);
    const parts: SQL[] = [];
    if (codes.length) parts.push(sql`d.jurisdiction_code = any(${codes})`);
    if (regions.includes(NATIONWIDE)) parts.push(sql`d.jurisdiction_code is null`);
    if (parts.length) conds.push(sql`(${sql.join(parts, sql` or `)})`);
  }

  return conds.length ? sql` and ${sql.join(conds, sql` and `)}` : sql``;
};

// Server-side faceted search over the PUBLIC corpus: SQL text matching, facet
// filters, sorting, and pagination, plus per-facet counts for the sidebar.
export const searchDocuments = async (params: SearchParams): Promise<SearchResult> => {
  const { q, types, regions, period, sort, pageSize } = params;
  const base = buildBase(q, period);
  const selections = buildSelections(types, regions);

  // Relevance = number of query terms hit in the title (title beats body),
  // then newest. With no query it collapses to newest-first.
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const relParts = terms.map(
    (term) => sql`(case when d.title ilike ${`%${term}%`} then 1 else 0 end)`
  );
  const orderBy =
    sort === "relevance" && relParts.length
      ? sql`(${sql.join(relParts, sql` + `)}) desc, v.effective_from desc nulls last`
      : sql`v.effective_from desc nulls last, d.created_at desc nulls last`;

  // Total first, so we can clamp the page before computing the offset.
  const totalRows = (await db.execute(sql`
    select count(*)::int as "total"
    from document d
    ${LATEST_VERSION}
    where ${base}${selections}
  `)) as unknown as { total: number }[];
  const total = totalRows[0]?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page), pageCount);
  const offset = (page - 1) * pageSize;

  const [items, typeFacets, regionFacets] = await Promise.all([
    db.execute(sql`
      select
        d.document_code     as "documentCode",
        d.title             as "title",
        d.authority_type    as "authorityType",
        d.jurisdiction_code as "jurisdictionCode",
        v.effective_from    as "effectiveFrom",
        s.snippet           as "snippet"
      from document d
      ${LATEST_VERSION}
      left join lateral (
        select se.original_text as snippet
        from source_evidence se
        where se.version_id = v.version_id and se.index_status = 'INDEXED'
        order by se.created_at asc nulls last
        limit 1
      ) s on true
      where ${base}${selections}
      order by ${orderBy}
      limit ${pageSize} offset ${offset}
    `) as unknown as Promise<SearchDocument[]>,
    db.execute(sql`
      select d.authority_type::text as "value", count(*)::int as "count"
      from document d
      ${LATEST_VERSION}
      where ${base}
      group by d.authority_type
      order by count(*) desc
    `) as unknown as Promise<FacetCount[]>,
    db.execute(sql`
      select coalesce(d.jurisdiction_code, ${NATIONWIDE}) as "value", count(*)::int as "count"
      from document d
      ${LATEST_VERSION}
      where ${base}
      group by d.jurisdiction_code
      order by count(*) desc
    `) as unknown as Promise<FacetCount[]>,
  ]);

  return {
    items: items as SearchDocument[],
    total,
    page,
    pageCount,
    facets: { types: typeFacets as FacetCount[], regions: regionFacets as FacetCount[] },
  };
};
