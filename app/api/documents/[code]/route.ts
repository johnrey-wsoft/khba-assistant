import { apiResponse } from "@/lib/response";
import { HttpStatus } from "@/constants/http-status.constant";
import { getDocumentByCode } from "@/lib/ai/retrieval";

// Public: returns the full PUBLIC document (all passages) for the source panel.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  try {
    const document = await getDocumentByCode(code);
    if (!document) {
      return apiResponse({ status: HttpStatus.NOT_FOUND });
    }
    return apiResponse({ data: document, status: HttpStatus.OK });
  } catch (error) {
    console.error("[documents] failed to load:", error);
    return apiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}
