import { axiosInstance } from "@/config/axios.config";
import type { ChatListItem, ChatWithMessages } from "@/lib/chat/types";

import { API_ROUTES } from "@/constants/routes.constant";

export type { ChatListItem, ChatWithMessages };

// Client access to the chat REST endpoints. Mirrors services/users.service.ts:
// unwrap the { data } envelope, and fail soft (null / []) on error so callers
// can render an empty state instead of throwing.
export const chatsService = {
  list: async (): Promise<ChatListItem[]> => {
    try {
      const response = await axiosInstance.get<{ data: ChatListItem[] }>(API_ROUTES.CHATS.ROOT);
      return response.data.data ?? [];
    } catch (error) {
      console.error("Failed to list chats:", error);
      return [];
    }
  },

  get: async (id: string): Promise<ChatWithMessages | null> => {
    try {
      const response = await axiosInstance.get<{ data: ChatWithMessages | null }>(
        API_ROUTES.CHATS.BY_ID(id)
      );
      return response.data.data ?? null;
    } catch (error) {
      console.error("Failed to load chat:", error);
      return null;
    }
  },

  rename: async (id: string, title: string): Promise<boolean> => {
    try {
      await axiosInstance.patch(API_ROUTES.CHATS.BY_ID(id), { title });
      return true;
    } catch (error) {
      console.error("Failed to rename chat:", error);
      return false;
    }
  },

  remove: async (id: string): Promise<boolean> => {
    try {
      await axiosInstance.delete(API_ROUTES.CHATS.BY_ID(id));
      return true;
    } catch (error) {
      console.error("Failed to delete chat:", error);
      return false;
    }
  },
};
