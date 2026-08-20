import { axiosInstance } from "@/config/axios.config";
import type { AdminDocument, AdminDocumentPatch } from "@/lib/admin/types";

import { API_ROUTES } from "@/constants/routes.constant";

export type { AdminDocument, AdminDocumentPatch };

export const adminDocumentsService = {
  list: async (): Promise<AdminDocument[]> => {
    try {
      const response = await axiosInstance.get<{ data: AdminDocument[] }>(
        API_ROUTES.ADMIN.DOCUMENTS.ROOT
      );
      return response.data.data ?? [];
    } catch (error) {
      console.error("Failed to list documents:", error);
      return [];
    }
  },

  // Throws on failure so the mutation onError can surface it.
  update: async (code: string, patch: AdminDocumentPatch): Promise<void> => {
    await axiosInstance.patch(API_ROUTES.ADMIN.DOCUMENTS.BY_CODE(code), patch);
  },

  // Re-run the ingest pipeline for one document (durable workflow).
  reindex: async (code: string): Promise<void> => {
    await axiosInstance.post(API_ROUTES.INGEST, { codes: [code] });
  },
};
