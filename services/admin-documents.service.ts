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

  // Permanently delete a document and all its data. Throws on failure.
  remove: async (code: string): Promise<void> => {
    await axiosInstance.delete(API_ROUTES.ADMIN.DOCUMENTS.BY_CODE(code));
  },

  // Upload + ingest a file. Uses fetch (not axios) to send multipart without a
  // forced JSON content-type. Throws on failure.
  upload: async (file: File): Promise<void> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(API_ROUTES.ADMIN.DOCUMENTS.UPLOAD, { method: "POST", body: form });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new Error(detail?.error || detail?.message || "Upload failed");
    }
  },
};
