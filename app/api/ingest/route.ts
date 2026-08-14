import { start } from "workflow/api";

import { requireAdmin } from "@/lib/guards/role.guard";
import { apiResponse } from "@/lib/response";
import { HttpStatus } from "@/constants/http-status.constant";
import { loadManifest } from "@/lib/ingest/manifest";
import { ingestDocumentWorkflow } from "@/workflows/ingest";

export const runtime = "nodejs";
export const maxDuration = 60;

// Admin-only trigger: starts one durable ingest workflow run per document.
// Returns immediately with run ids; the actual OCR/embed/upsert runs durably
// (retries, survives crashes/timeouts) and is observable in the Workflows
// dashboard (`npx workflow web` locally).
export async function POST(req: Request) {
  // Triggering ingestion spends LlamaCloud/OpenAI credits and writes to the DB,
  // so it is admin-only (401 when unauthenticated, 403 for non-admins).
  const { error } = await requireAdmin();
  if (error) return error;

  // Optional body { "codes": ["ORD-..."] } to ingest a subset; omit for all.
  let codes: string[] | undefined;
  try {
    codes = (await req.json())?.codes;
  } catch {
    // no body -> ingest everything in the manifest
  }

  const entries = loadManifest().filter((entry) => !codes || codes.includes(entry.documentCode));

  // Fan out: one run per document (independent retries + parallelism).
  const runs = await Promise.all(
    entries.map(async (entry) => {
      const run = await start(ingestDocumentWorkflow, [entry]);
      return { documentCode: entry.documentCode, runId: run.runId };
    })
  );

  return apiResponse({
    data: { started: runs.length, runs },
    status: HttpStatus.OK,
  });
}
