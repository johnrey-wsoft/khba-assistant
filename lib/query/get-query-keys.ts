export const getQueryKey = {
  users: {
    all: ["users"] as const,
    me: () => [...getQueryKey.users.all, "me"] as const,
  },
  chats: {
    all: ["chats"] as const,
    list: () => [...getQueryKey.chats.all, "list"] as const,
    detail: (id: string) => [...getQueryKey.chats.all, "detail", id] as const,
  },
  admin: {
    all: ["admin"] as const,
    users: () => [...getQueryKey.admin.all, "users"] as const,
  },
} as const;
