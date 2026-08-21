// A searchable public document (one row in the faceted search results).
export type SearchDocument = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  effectiveFrom: string | null;
  snippet: string | null;
};

export type DocSort = "date" | "relevance";
export type DocPeriod = "all" | "2026" | "recent";

// Null jurisdiction = nationwide. A sentinel lets it travel as a facet value.
export const NATIONWIDE = "__nationwide__";

export const DOC_SORTS: DocSort[] = ["date", "relevance"];
export const DOC_PERIODS: DocPeriod[] = ["all", "2026", "recent"];

export type SearchParams = {
  q: string;
  types: string[];
  regions: string[]; // jurisdiction codes; may include NATIONWIDE
  period: DocPeriod;
  sort: DocSort;
  page: number;
  pageSize: number;
};

export type FacetCount = { value: string; count: number };

export type SearchResult = {
  items: SearchDocument[];
  total: number;
  page: number;
  pageCount: number;
  facets: { types: FacetCount[]; regions: FacetCount[] };
};
