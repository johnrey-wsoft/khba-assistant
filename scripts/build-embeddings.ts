import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env (OPENAI_API_KEY) before any embedding call. Runs at module eval,
// i.e. before main(), so the provider picks up the key lazily at request time.
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
    // no .env — rely on the ambient environment
  }
})();

import { semanticChunk } from "../lib/ai/chunking";
import {
  embedTexts,
  EMBEDDING_MODEL_ID,
  EMBEDDING_DIMENSIONS,
} from "../lib/ai/embeddings";

type InputVersion = {
  versionNo: number;
  effectiveFrom: string | null;
  rawObjectPath: string;
  content: string;
};

type InputDocument = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  securityClass: string;
  version: InputVersion;
};

const INPUT_PATH = resolve(process.cwd(), "data/khba-documents.json");
const OUTPUT_PATH = resolve(process.cwd(), "data/khba-index.json");

async function main() {
  const input = JSON.parse(readFileSync(INPUT_PATH, "utf8")) as {
    documents: InputDocument[];
  };

  const documents = [];
  let totalChunks = 0;

  for (const doc of input.documents) {
    const chunks = await semanticChunk(doc.version.content);
    const embeddings = await embedTexts(chunks);
    totalChunks += chunks.length;

    documents.push({
      documentCode: doc.documentCode,
      title: doc.title,
      authorityType: doc.authorityType,
      jurisdictionCode: doc.jurisdictionCode,
      securityClass: doc.securityClass,
      version: {
        versionNo: doc.version.versionNo,
        effectiveFrom: doc.version.effectiveFrom,
        rawObjectPath: doc.version.rawObjectPath,
      },
      chunks: chunks.map((text, i) => ({ text, embedding: embeddings[i] })),
    });

    console.log(`  ${doc.documentCode.padEnd(20)} ${chunks.length} chunks`);
  }

  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({
      embeddingModel: EMBEDDING_MODEL_ID,
      dimensions: EMBEDDING_DIMENSIONS,
      generatedFrom: "data/khba-documents.json",
      documents,
    }),
  );

  console.log(
    `\nWrote data/khba-index.json — ${documents.length} documents, ${totalChunks} chunks (${EMBEDDING_DIMENSIONS}d ${EMBEDDING_MODEL_ID}).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
