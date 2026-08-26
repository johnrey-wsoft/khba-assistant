import { readFileSync } from "node:fs";
import { basename } from "node:path";

// HWPX parser using the local Java hwp-api service (hwpxlib). Self-hosted
// replacement for the Upstage Document Parse API on the .hwpx path. Shares the
// same service (and NEXT_PUBLIC_API_URL) as the .hwp parser; returns markdown
// so the rest of the pipeline (chunk -> embed -> upsert) is unchanged.
const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

type HwpxParseResponse = {
  success: boolean;
  markdown?: string;
  error?: string;
};

export const parseWithHwpx = async (filePath: string): Promise<string> => {
  const apiUrl = getApiUrl();
  const endpoint = `${apiUrl}/convert/hwpx-to-markdown`;

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(readFileSync(filePath))]), basename(filePath));

  const res = await fetch(endpoint, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`HWPX API failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as HwpxParseResponse;

  if (!json.success) {
    throw new Error(`HWPX API error: ${json.error || "Unknown error"}`);
  }

  return (json.markdown ?? "").trim();
};
