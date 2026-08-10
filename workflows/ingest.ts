import { db } from "@/lib/drizzle/db";
import { parseDocument } from "@/lib/ingest/parse";
import { upsertDocuments } from "@/lib/ingest/upsert";
import { semanticChunk } from "@/lib/ai/chunking";
import { embedTexts } from "@/lib/ai/embeddings";
import { resolveDocumentPath, type ManifestEntry } from "@/lib/ingest/manifest";
import { logIngest, since } from "@/lib/ingest/log";

// --- Steps (durable, auto-retried, run as isolated Node functions) --------
// Logs live INSIDE the steps (not the workflow orchestrator): steps don't
// re-run once cached, so this avoids duplicate lines on replay. Output shows in
// the Workflows dashboard (`npx workflow web`).

// Agentic OCR — the expensive/flaky call gets its own step, so a later
// failure (embed/DB) never re-runs OCR (saves LlamaCloud cost).
async function ocrStep(entry: ManifestEntry): Promise<string> {
  "use step";
  const started = Date.now();
  logIngest("workflow", "ocr start", { doc: entry.documentCode, file: entry.file });
  const markdown = await parseDocument(resolveDocumentPath(entry.file));
  logIngest("workflow", "ocr done", {
    doc: entry.documentCode,
    chars: markdown.length,
    took: since(started),
  });
  return markdown;
}

// Chunk + embed + upsert. Embeddings stay INSIDE this step so 1536-dim
// vectors never cross a step boundary (they'd bloat the durable event log).
async function indexStep(entry: ManifestEntry, markdown: string): Promise<number> {
  "use step";
  const started = Date.now();

  const chunks = await semanticChunk(markdown);
  logIngest("workflow", "chunked", { doc: entry.documentCode, chunks: chunks.length });

  const embeddings = await embedTexts(chunks);
  logIngest("workflow", "embedded", { doc: entry.documentCode, vectors: embeddings.length });

  const evidenceCount = await upsertDocuments(db, [
    {
      documentCode: entry.documentCode,
      title: entry.title,
      authorityType: entry.authorityType,
      jurisdictionCode: entry.jurisdictionCode ?? null,
      securityClass: entry.securityClass ?? "PUBLIC",
      version: {
        versionNo: entry.version?.versionNo ?? 1,
        effectiveFrom: entry.version?.effectiveFrom ?? null,
        rawObjectPath: entry.file,
      },
      chunks: chunks.map((text, i) => ({ text, embedding: embeddings[i] })),
    },
  ]);
  logIngest("workflow", "indexed", {
    doc: entry.documentCode,
    evidence: evidenceCount,
    took: since(started),
  });
  return evidenceCount;
}

// --- Workflow (deterministic orchestrator; all I/O lives in steps) --------

export async function ingestDocumentWorkflow(entry: ManifestEntry) {
  "use workflow";

  const markdown = await ocrStep(entry);
  const evidenceCount = await indexStep(entry, markdown);

  return { documentCode: entry.documentCode, evidenceCount };
}
