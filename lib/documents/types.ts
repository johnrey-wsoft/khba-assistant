// A searchable public document (one row in the faceted search results).
export type SearchDocument = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  effectiveFrom: string | null;
  snippet: string | null;
};
