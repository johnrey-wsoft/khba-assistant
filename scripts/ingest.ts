import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env (LLAMA_CLOUD_API_KEY, OPENAI_API_KEY, DATABASE_URL) before use.
(function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // rely on ambient env
  }
})();

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { parseDocumentToMarkdown } from "../lib/ingest/parse";
import { upsertDocuments } from "../lib/ingest/upsert";
import { semanticChunk } from "../lib/ai/chunking";
import { embedTexts } from "../lib/ai/embeddings";
import { logIngest, since } from "../lib/ingest/log";

type ManifestEntry = {
  file: string; // relative to data/ingest
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode?: string | null;
  securityClass?: string;
  version?: { versionNo?: number; effectiveFrom?: string | null };
};

const MANIFEST_PATH = resolve(process.cwd(), "data/ingest/manifest.json");
// Manifest `file` paths are relative to the data directory (e.g. "documents/x.pdf").
const DATA_DIR = resolve(process.cwd(), "data");

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as {
    documents: ManifestEntry[];
  };

  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!process.env.LLAMA_CLOUD_API_KEY) {
    throw new Error("LLAMA_CLOUD_API_KEY is not set");
  }

  const client = postgres(process.env.DATABASE_URL, {
    ssl: "require",
    prepare: false,
    max: 1,
    connect_timeout: 15,
    idle_timeout: 5,
  });
  const db = drizzle(client);

  const total = manifest.documents.length;
  const runStart = Date.now();
  let ok = 0;
  let totalEvidence = 0;
  const failures: string[] = [];

  // Process one document at a time so a single bad file (e.g. an OCR failure on
  // a tricky HWP) is logged and skipped instead of aborting the whole batch.
  try {
    for (const [i, entry] of manifest.documents.entries()) {
      const tag = `${i + 1}/${total}`;
      const docStart = Date.now();
      try {
        const filePath = resolve(DATA_DIR, entry.file);

        const tParse = Date.now();
        logIngest("cli", `parse start ${tag}`, { doc: entry.documentCode, file: entry.file });
        const markdown = await parseDocumentToMarkdown(filePath);
        logIngest("cli", `parsed ${tag}`, {
          doc: entry.documentCode,
          chars: markdown.length,
          took: since(tParse),
        });

        const tChunk = Date.now();
        const chunks = await semanticChunk(markdown);
        logIngest("cli", `chunked ${tag}`, {
          doc: entry.documentCode,
          chunks: chunks.length,
          took: since(tChunk),
        });

        const tEmbed = Date.now();
        const embeddings = await embedTexts(chunks);
        logIngest("cli", `embedded ${tag}`, {
          doc: entry.documentCode,
          vectors: embeddings.length,
          took: since(tEmbed),
        });

        const evidence = await upsertDocuments(db, [
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
            chunks: chunks.map((text, idx) => ({ text, embedding: embeddings[idx] })),
          },
        ]);
        totalEvidence += evidence;
        ok++;
        logIngest("cli", `done ${tag}`, {
          doc: entry.documentCode,
          evidence,
          took: since(docStart),
        });
      } catch (err) {
        failures.push(entry.documentCode);
        logIngest("cli", `FAILED ${tag}`, {
          doc: entry.documentCode,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } finally {
    await client.end();
  }

  logIngest("cli", "summary", {
    ok,
    failed: failures.length,
    evidence: totalEvidence,
    took: since(runStart),
  });
  if (failures.length) {
    logIngest("cli", "failed docs", { codes: failures.join(",") });
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
