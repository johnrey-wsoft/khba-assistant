import { queryOptions } from "@tanstack/react-query";

import { adminDocumentsService } from "@/services/admin-documents.service";
import { getQueryKey } from "@/lib/query/get-query-keys";

// All documents, for the admin document-pipeline console.
export const getAdminDocumentsQueryOptions = () =>
  queryOptions({
    queryKey: getQueryKey.admin.documents(),
    queryFn: () => adminDocumentsService.list(),
  });
