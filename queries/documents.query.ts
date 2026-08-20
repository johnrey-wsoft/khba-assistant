import { queryOptions } from "@tanstack/react-query";

import { documentsService } from "@/services/documents.service";
import { getQueryKey } from "@/lib/query/get-query-keys";

// The browsable PUBLIC corpus, for the faceted search page.
export const getSearchDocumentsQueryOptions = () =>
  queryOptions({
    queryKey: getQueryKey.documents.search(),
    queryFn: () => documentsService.search(),
  });
