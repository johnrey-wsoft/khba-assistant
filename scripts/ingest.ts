import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createHash } from "node:crypto";

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

import { parseDocument } from "../lib/ingest/parse";
import { upsertDocuments } from "../lib/ingest/upsert";
import { semanticChunk } from "../lib/ai/chunking";
import { embedTexts } from "../lib/ai/embeddings";
import { logIngest, since } from "../lib/ingest/log";
import {
  isR2Configured,
  buildRawObjectKey,
  contentTypeFor,
  uploadRawObject,
} from "../lib/storage/r2";

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

  // Optional `--codes=A,B,C` (or `--codes A,B,C`) to ingest a subset — handy for
  // re-running just the docs that failed, without re-parsing the whole corpus.
  const codesArg = process.argv.find((a) => a.startsWith("--codes="))?.slice("--codes=".length);
  const flagIdx = process.argv.indexOf("--codes");
  const codesRaw = codesArg ?? (flagIdx >= 0 ? process.argv[flagIdx + 1] : undefined);
  const codes = codesRaw
    ? new Set(
        codesRaw
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      )
    : null;

  const docs = codes
    ? manifest.documents.filter((d) => codes.has(d.documentCode))
    : manifest.documents;

  if (codes && docs.length === 0) {
    throw new Error(`No manifest entries match --codes: ${codesRaw}`);
  }

  const isHwp = (file: string) => file.toLowerCase().endsWith(".hwp");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (docs.some((d) => !isHwp(d.file)) && !process.env.LLAMA_CLOUD_API_KEY) {
    throw new Error("LLAMA_CLOUD_API_KEY is not set");
  }
  if (docs.some((d) => isHwp(d.file)) && !process.env.NEXT_PUBLIC_API_URL) {
    console.warn("NEXT_PUBLIC_API_URL not set, using default http://localhost:8000 for HWP files");
  }

  const client = postgres(process.env.DATABASE_URL, {
    ssl: "require",
    prepare: false,
    max: 1,
    connect_timeout: 15,
    idle_timeout: 5,
  });
  const db = drizzle(client);

  const total = docs.length;
  logIngest("cli", "run start", { docs: total, codes: codesRaw ?? "all" });
  const runStart = Date.now();
  let ok = 0;
  let totalEvidence = 0;
  const failures: string[] = [];

  // Process one document at a time so a single bad file (e.g. an OCR failure on
  // a tricky HWP) is logged and skipped instead of aborting the whole batch.
  try {
    for (const [i, entry] of docs.entries()) {
      const tag = `${i + 1}/${total}`;
      const docStart = Date.now();
      try {
        const filePath = resolve(DATA_DIR, entry.file);
        const versionNo = entry.version?.versionNo ?? 1;

        // Raw bytes: SHA-256 for integrity, plus upload to R2 when configured.
        const fileBytes = readFileSync(filePath);
        const sourceHash = createHash("sha256").update(fileBytes).digest("hex");
        const contentType = contentTypeFor(entry.file);
        let stored: Awaited<ReturnType<typeof uploadRawObject>> | null = null;
        if (isR2Configured()) {
          const key = buildRawObjectKey(entry.documentCode, versionNo, entry.file);
          stored = await uploadRawObject({ key, body: fileBytes, contentType });
          logIngest("cli", `uploaded ${tag}`, {
            doc: entry.documentCode,
            key: stored.key,
            bytes: stored.sizeBytes,
          });
        }

        const tParse = Date.now();
        logIngest("cli", `parse start ${tag}`, { doc: entry.documentCode, file: entry.file });
        const markdown = await parseDocument(filePath);
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
              versionNo,
              effectiveFrom: entry.version?.effectiveFrom ?? null,
              // R2 key when uploaded, else the local manifest path.
              rawObjectPath: stored?.key ?? entry.file,
              sourceHash,
              storageBucket: stored?.bucket ?? null,
              contentType: stored?.contentType ?? contentType,
              sizeBytes: stored?.sizeBytes ?? fileBytes.byteLength,
              originalFilename: basename(entry.file),
              etag: stored?.etag ?? null,
              uploadedAt: stored ? new Date() : null,
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
