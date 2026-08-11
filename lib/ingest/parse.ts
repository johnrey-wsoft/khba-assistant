import fs from "node:fs";
import { extname } from "node:path";

import LlamaCloud from "@llamaindex/llama-cloud";

import { parseWithHwp } from "./hwp";

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
  });

  const parts: string[] = [];
  for (const page of result.markdown?.pages ?? []) {
    if (page.success) parts.push(page.markdown);
  }
  return parts.join("\n\n").trim();
};

// Format-aware entry point for the pipeline. HWP is an OLE2/CFB binary that
// LlamaParse's agentic OCR rejects, so it is routed to the HWP parser
// using pyhwp via FastAPI; every other format uses LlamaParse agentic OCR.
export const parseDocument = async (filePath: string): Promise<string> => {
  if (extname(filePath).toLowerCase() === ".hwp") {
    return parseWithHwp(filePath);
  }
  return parseDocumentToMarkdown(filePath);
};
