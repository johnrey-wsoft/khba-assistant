import { queryOptions } from "@tanstack/react-query";

import { usersService } from "@/services/users.service";
import { getQueryKey } from "@/lib/query/get-query-keys";

export const getUserQueryOptions = () =>
  queryOptions({
    queryKey: getQueryKey.users.me(),
    queryFn: () => usersService.me(),
  });
