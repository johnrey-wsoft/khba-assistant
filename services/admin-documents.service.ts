import { axiosInstance } from "@/config/axios.config";
import type {
  AdminDocsParams,
  AdminDocsResult,
  AdminDocument,
  AdminDocumentPatch,
} from "@/lib/admin/types";

import { API_ROUTES } from "@/constants/routes.constant";

export type { AdminDocument, AdminDocumentPatch, AdminDocsParams, AdminDocsResult };

const EMPTY: AdminDocsResult = {
  items: [],
  total: 0,
  page: 1,
  pageCount: 1,
  stats: { total: 0, completed: 0, waiting: 0, failed: 0, evidence: 0 },
};

export const adminDocumentsService = {
  // Server-side paginated list (page + status filter) with global stat counts.
  search: async (params: AdminDocsParams): Promise<AdminDocsResult> => {
    const query = new URLSearchParams({
      status: params.status,
      page: String(params.page),
      pageSize: String(params.pageSize),
    });
    try {
      const response = await axiosInstance.get<{ data: AdminDocsResult }>(
        `${API_ROUTES.ADMIN.DOCUMENTS.ROOT}?${query.toString()}`
      );
      return response.data.data ?? EMPTY;
    } catch (error) {
      console.error("Failed to list documents:", error);
      return EMPTY;
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
