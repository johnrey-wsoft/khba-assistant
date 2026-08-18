import { queryOptions } from "@tanstack/react-query";

import { adminService } from "@/services/admin.service";
import { getQueryKey } from "@/lib/query/get-query-keys";

// All members, for the admin user-management table.
export const getAdminUsersQueryOptions = () =>
  queryOptions({
    queryKey: getQueryKey.admin.users(),
    queryFn: () => adminService.listUsers(),
  });
