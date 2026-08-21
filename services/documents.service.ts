import { axiosInstance } from "@/config/axios.config";
import type { SearchParams, SearchResult } from "@/lib/documents/types";

import { API_ROUTES } from "@/constants/routes.constant";

export type { SearchParams, SearchResult };

const EMPTY: SearchResult = {
  items: [],
  total: 0,
  page: 1,
  pageCount: 1,
  facets: { types: [], regions: [] },
};

export const documentsService = {
  // Server-side faceted search over the PUBLIC corpus.
  search: async (params: SearchParams): Promise<SearchResult> => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.types.length) query.set("types", params.types.join(","));
    if (params.regions.length) query.set("regions", params.regions.join(","));
    query.set("period", params.period);
    query.set("sort", params.sort);
    query.set("page", String(params.page));
    query.set("pageSize", String(params.pageSize));

    try {
      const response = await axiosInstance.get<{ data: SearchResult }>(
        `${API_ROUTES.DOCUMENTS.ROOT}?${query.toString()}`
      );
      return response.data.data ?? EMPTY;
    } catch (error) {
      console.error("Failed to search documents:", error);
      return EMPTY;
    }
  },
};
