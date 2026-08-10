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
import { upsertDocuments, type PreparedDocument } from "../lib/ingest/upsert";
import { semanticChunk } from "../lib/ai/chunking";
import { embedTexts } from "../lib/ai/embeddings";

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

  const prepared: PreparedDocument[] = [];

  for (const entry of manifest.documents) {
    const filePath = resolve(DATA_DIR, entry.file);
    console.log(`  parsing  ${entry.documentCode.padEnd(20)} <- ${entry.file}`);

    const markdown = await parseDocumentToMarkdown(filePath);
    const chunks = await semanticChunk(markdown);
    const embeddings = await embedTexts(chunks);

    prepared.push({
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
    });

    console.log(`           ${chunks.length} chunks`);
  }

  const client = postgres(process.env.DATABASE_URL, {
    ssl: "require",
    prepare: false,
    max: 1,
    connect_timeout: 15,
    idle_timeout: 5,
  });
  const db = drizzle(client);

  try {
    const evidenceCount = await upsertDocuments(db, prepared);
    console.log(
      `\nIngested ${prepared.length} documents, ${evidenceCount} evidence rows.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
