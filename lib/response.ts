import { NextResponse } from "next/server";

import { HttpStatus, getStatusText } from "@/constants/http-status.constant";

interface ApiResponseProp<T> {
  data?: T | null;
  status: number;
  message?: string;
  headers?: Record<string, string>;
}

// Statuses that must not carry a response body — the Response constructor throws
// if you attach one (e.g. NextResponse.json on 204).
const BODYLESS_STATUSES = new Set<number>([HttpStatus.NO_CONTENT, 304]);

export function apiResponse<T>(prop: ApiResponseProp<T>): NextResponse {
  const { data, status, message, headers } = prop;

  if (BODYLESS_STATUSES.has(status)) {
    return new NextResponse(null, { status, headers });
  }

  const success = status >= 200 && status < 300;

  return NextResponse.json(
    {
      success,
      data: success ? (data ?? null) : null,
      ...(message ? { message } : {}),
      ...(success ? {} : { error: getStatusText(status) }),
    },
    { status, headers }
  );
}
