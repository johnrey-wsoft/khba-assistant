import { readFileSync } from "node:fs";
import { basename } from "node:path";

// Document parser using the Python FastAPI service with Microsoft's MarkItDown.
// A free, self-hosted alternative to LlamaParse for non-HWP formats (PDF, DOCX,
// PPTX, XLSX, HTML, images, ...). Returns the document as markdown so the rest
// of the pipeline (chunk -> embed -> upsert) is unchanged.
//
// Not wired into parse.ts yet — call this directly, or route to it there when
// you're ready to replace LlamaParse.
const getApiUrl = () => {
  return process.env.MARKITDOWN_API_URL || "http://localhost:8001";
};

type MarkItDownParseResponse = {
  success: boolean;
  markdown?: string;
  error?: string;
};

export const parseWithMarkItDown = async (filePath: string): Promise<string> => {
  const apiUrl = getApiUrl();
  const endpoint = `${apiUrl}/convert/to-markdown`;

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(readFileSync(filePath))]), basename(filePath));

  const res = await fetch(endpoint, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`MarkItDown API failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as MarkItDownParseResponse;

  if (!json.success) {
    throw new Error(`MarkItDown API error: ${json.error || "Unknown error"}`);
  }

  return (json.markdown ?? "").trim();
};
