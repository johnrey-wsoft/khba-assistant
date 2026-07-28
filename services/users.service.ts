import { axiosInstance } from "@/config/axios.config";
import type { SelectProfile } from "@/types/drizzle.types";

import { API_ROUTES } from "@/constants/routes.constant";

export const usersService = {
  me: async (): Promise<SelectProfile | null> => {
    try {
      const response = await axiosInstance.get<{ data: SelectProfile | null }>(API_ROUTES.USERS.ME);
      return response.data.data ?? null;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
    }
  },
};
