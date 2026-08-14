import { queryOptions } from "@tanstack/react-query";

import { chatsService } from "@/services/chats.service";
import { getQueryKey } from "@/lib/query/get-query-keys";

// Thread list: the current user's chats.
export const getChatsQueryOptions = () =>
  queryOptions({
    queryKey: getQueryKey.chats.list(),
    queryFn: () => chatsService.list(),
  });

// A single chat with its messages. `enabled` guards the empty-id case (e.g. the
// fresh /chat route before an id is minted).
export const getChatQueryOptions = (id: string) =>
  queryOptions({
    queryKey: getQueryKey.chats.detail(id),
    queryFn: () => chatsService.get(id),
    enabled: Boolean(id),
  });
