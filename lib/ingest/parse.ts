import fs from "node:fs";

import LlamaCloud from "@llamaindex/llama-cloud";

// Agentic OCR: parse a local document (PDF, image, HWP, 130+ formats) to
// markdown via LlamaCloud. `tier: "agentic"` analyzes the whole document in
// one pass (OCR + vision + reasoning) for better tables/layout continuity.
export const parseDocumentToMarkdown = async (filePath: string): Promise<string> => {
  // Constructed lazily so the API key is read after the caller loads .env.
  const client = new LlamaCloud({ apiKey: process.env.LLAMA_CLOUD_API_KEY });

  const result = await client.parsing.parse({
    tier: "agentic",
    version: "latest",
    upload_file: fs.createReadStream(filePath),
    expand: ["markdown"],
  });

  const parts: string[] = [];
  for (const page of result.markdown?.pages ?? []) {
    if (page.success) parts.push(page.markdown);
  }
  return parts.join("\n\n").trim();
};
