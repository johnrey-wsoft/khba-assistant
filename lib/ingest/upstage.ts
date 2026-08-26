import { readFileSync } from "node:fs";
import { basename } from "node:path";

// Upstage Document Parse — a Korean-optimized cloud parser for `.hwpx` (OWPML
// zip). Kept as an available alternative; the active .hwp/.hwpx path is the
// local Java hwp-api (hwplib/hwpxlib) in parse.ts, so this is NOT wired in.
// Call parseWithUpstage directly if you ever need the cloud parser.
// Returns markdown so the pipeline (chunk -> embed -> upsert) is unchanged.
//
// Uses the synchronous endpoint (our files are far under the 100-page / 50MB
// limits). `mode=auto` lets Upstage pick standard/enhanced per page for
// cost/accuracy; merged multi-page tables suit these table-heavy forms.
const ENDPOINT = "https://api.upstage.ai/v1/document-digitization";

type DocumentParseResponse = { content?: { markdown?: string } };

export const parseWithUpstage = async (filePath: string): Promise<string> => {
  const apiKey = process.env.UPSTAGE_API_KEY;
  if (!apiKey) throw new Error("UPSTAGE_API_KEY is not set");

  const form = new FormData();
  form.append("document", new Blob([new Uint8Array(readFileSync(filePath))]), basename(filePath));
  form.append("model", "document-parse");
  form.append("mode", "auto");
  form.append("output_formats", '["markdown"]');
  form.append("merge_multipage_tables", "true");
  form.append("coordinates", "false");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Upstage Document Parse failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as DocumentParseResponse;
  return (json.content?.markdown ?? "").trim();
};
