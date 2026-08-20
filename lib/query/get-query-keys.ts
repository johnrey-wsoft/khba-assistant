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
  documents: {
    all: ["documents"] as const,
    search: () => [...getQueryKey.documents.all, "search"] as const,
  },
  admin: {
    all: ["admin"] as const,
    users: () => [...getQueryKey.admin.all, "users"] as const,
    documents: () => [...getQueryKey.admin.all, "documents"] as const,
  },
} as const;
