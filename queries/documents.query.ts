import { queryOptions, keepPreviousData } from "@tanstack/react-query";

import { documentsService } from "@/services/documents.service";
import { getQueryKey } from "@/lib/query/get-query-keys";
import type { SearchParams } from "@/lib/documents/types";

// Server-side faceted search. The key includes the params so each distinct
// query is cached; keepPreviousData avoids a flash of empty state while paging
// or refining filters.
export const getSearchDocumentsQueryOptions = (params: SearchParams) =>
  queryOptions({
    queryKey: [...getQueryKey.documents.search(), params],
    queryFn: () => documentsService.search(params),
    placeholderData: keepPreviousData,
  });
