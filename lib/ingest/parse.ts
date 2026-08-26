import fs from "node:fs";
import { extname } from "node:path";

import LlamaCloud from "@llamaindex/llama-cloud";

import { parseWithHwp } from "./hwp";
import { parseWithHwpx } from "./hwpx";
import { parseWithMarkItDown } from "./markitdown";

// Agentic OCR: parse a local document (PDF, image, HWP, 130+ formats) to
// markdown via LlamaCloud. `tier: "agentic"` analyzes the whole document in
// one pass (OCR + vision + reasoning) for better tables/layout continuity.
export const parseDocumentToMarkdown = async (filePath: string): Promise<string> => {
  // Constructed lazily so the API key is read after the caller loads .env.
  // The default per-request timeout is 60s, but agentic OCR routinely runs
  // longer server-side, so raise it well past a typical parse.
  const client = new LlamaCloud({
    apiKey: process.env.LLAMA_CLOUD_API_KEY,
    timeout: 5 * 60 * 1000,
  });

  const result = await client.parsing.parse(
    {
      tier: "agentic",
      version: "latest",
      upload_file: fs.createReadStream(filePath),
      expand: ["markdown"],
      // Emit tables as markdown pipe tables (RAG-friendly) instead of HTML
      // <table> tags, and stitch tables that span pages.
      output_options: {
        markdown: {
          tables: {
            output_tables_as_markdown: true,
            merge_continued_tables: true,
          },
        },
      },
    },
    // Poll up to 5 minutes for the job to finish.
    { timeout: 5 * 60 * 1000 }
  );

  const parts: string[] = [];
  for (const page of result.markdown?.pages ?? []) {
    if (page.success) parts.push(page.markdown);
  }
  return parts.join("\n\n").trim();
};

// Format-aware entry point for the pipeline:
//   .hwp   -> local Java hwp-api service (hwplib; OLE2/CFB binary)
//   .hwpx  -> local Java hwp-api service (hwpxlib; OWPML zip)
//   else   -> self-hosted MarkItDown service (free replacement for LlamaParse)
// `parseDocumentToMarkdown` above is kept as a fallback — swap it back in here
// to return to LlamaParse.
export const parseDocument = async (filePath: string): Promise<string> => {
  const ext = extname(filePath).toLowerCase();
  if (ext === ".hwp") {
    return parseWithHwp(filePath);
  }
  if (ext === ".hwpx") {
    return parseWithHwpx(filePath);
  }
  return parseWithMarkItDown(filePath);
};
