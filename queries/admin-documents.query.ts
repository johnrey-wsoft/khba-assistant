import { queryOptions, keepPreviousData } from "@tanstack/react-query";

import { adminDocumentsService } from "@/services/admin-documents.service";
import { getQueryKey } from "@/lib/query/get-query-keys";
import type { AdminDocsParams } from "@/lib/admin/types";

// Server-side paginated documents for the admin pipeline console. The key
// includes the params so each page/filter is cached; keepPreviousData avoids a
// flash of empty state while paging.
export const getAdminDocumentsQueryOptions = (params: AdminDocsParams) =>
  queryOptions({
    queryKey: [...getQueryKey.admin.documents(), params],
    queryFn: () => adminDocumentsService.search(params),
    placeholderData: keepPreviousData,
  });
