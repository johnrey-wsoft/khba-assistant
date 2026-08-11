import { readFileSync } from "node:fs";
import { basename } from "node:path";

// HWP parser using the Python FastAPI service with pyhwp.
// This replaces the Upstage Document Parse API for .hwp files.
// Returns the document as markdown so the rest of the pipeline
// (chunk -> embed -> upsert) is unchanged.
const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

type HwpParseResponse = {
  success: boolean;
  markdown?: string;
  error?: string;
};

export const parseWithHwp = async (filePath: string): Promise<string> => {
  const apiUrl = getApiUrl();
  const endpoint = `${apiUrl}/convert/hwp-to-markdown`;

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(readFileSync(filePath))]), basename(filePath));

  const res = await fetch(endpoint, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`HWP API failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as HwpParseResponse;

  if (!json.success) {
    throw new Error(`HWP API error: ${json.error || "Unknown error"}`);
  }

  return (json.markdown ?? "").trim();
};
