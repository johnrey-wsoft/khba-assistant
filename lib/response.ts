import { NextResponse } from "next/server";

import { getStatusText } from "@/constants/http-status.constant";

interface ApiResponseProp<T> {
  data?: T | null;
  status: number;
  message?: string;
  headers?: Record<string, string>;
}

export function apiResponse<T>(prop: ApiResponseProp<T>): NextResponse {
  const { data, status, message, headers } = prop;

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
