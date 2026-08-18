import { axiosInstance } from "@/config/axios.config";
import type { AdminMember, AdminMemberPatch } from "@/lib/admin/types";

import { API_ROUTES } from "@/constants/routes.constant";

export type { AdminMember, AdminMemberPatch };

export const adminService = {
  listUsers: async (): Promise<AdminMember[]> => {
    try {
      const response = await axiosInstance.get<{ data: AdminMember[] }>(
        API_ROUTES.ADMIN.USERS.ROOT
      );
      return response.data.data ?? [];
    } catch (error) {
      console.error("Failed to list members:", error);
      return [];
    }
  },

  // Throws on failure so the caller's mutation onError can surface it.
  updateUser: async (id: string, patch: AdminMemberPatch): Promise<AdminMember | null> => {
    const response = await axiosInstance.patch<{ data: AdminMember }>(
      API_ROUTES.ADMIN.USERS.BY_ID(id),
      patch
    );
    return response.data.data ?? null;
  },
};
