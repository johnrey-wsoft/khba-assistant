import { axiosInstance } from "@/config/axios.config";
import type { SearchDocument } from "@/lib/documents/types";

import { API_ROUTES } from "@/constants/routes.constant";

export type { SearchDocument };

export const documentsService = {
  // The browsable PUBLIC corpus for faceted search.
  search: async (): Promise<SearchDocument[]> => {
    try {
      const response = await axiosInstance.get<{ data: SearchDocument[] }>(
        API_ROUTES.DOCUMENTS.ROOT
      );
      return response.data.data ?? [];
    } catch (error) {
      console.error("Failed to list documents:", error);
      return [];
    }
  },
};
