import { apiResponse } from "@/lib/response";

import { HttpStatus } from "@/constants/http-status.constant";

export async function GET() {
  return apiResponse({
    data: { status: "ok" },
    status: HttpStatus.OK,
  });
}
