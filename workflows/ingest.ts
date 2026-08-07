import { db } from "@/lib/drizzle/db";
import { parseDocumentToMarkdown } from "@/lib/ingest/parse";
import { upsertDocuments } from "@/lib/ingest/upsert";
import { semanticChunk } from "@/lib/ai/chunking";
import { embedTexts } from "@/lib/ai/embeddings";
import { resolveDocumentPath, type ManifestEntry } from "@/lib/ingest/manifest";

// --- Steps (durable, auto-retried, run as isolated Node functions) --------

// Agentic OCR — the expensive/flaky call gets its own step, so a later
// failure (embed/DB) never re-runs OCR (saves LlamaCloud cost).
async function ocrStep(entry: ManifestEntry): Promise<string> {
  "use step";
  return parseDocumentToMarkdown(resolveDocumentPath(entry.file));
}

// Chunk + embed + upsert. Embeddings stay INSIDE this step so 1536-dim
// vectors never cross a step boundary (they'd bloat the durable event log).
async function indexStep(
  entry: ManifestEntry,
  markdown: string,
): Promise<number> {
  "use step";
  const chunks = await semanticChunk(markdown);
  const embeddings = await embedTexts(chunks);
  return upsertDocuments(db, [
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
}

// --- Workflow (deterministic orchestrator; all I/O lives in steps) --------

export async function ingestDocumentWorkflow(entry: ManifestEntry) {
  "use workflow";

  const markdown = await ocrStep(entry);
  const evidenceCount = await indexStep(entry, markdown);

  return { documentCode: entry.documentCode, evidenceCount };
}
