import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

// Load .env (DATABASE_URL) before importing the db client.
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
import { inArray, sql } from "drizzle-orm";

import {
  document,
  documentVersion,
  contentNode,
  sourceEvidence,
} from "../drizzle/schemas";
import { EMBEDDING_MODEL_ID, EMBEDDING_DIMENSIONS } from "../lib/ai/embeddings";

// §4-4 — evidence grade derived from authority type.
const GRADE: Record<string, string> = {
  LAW: "A",
  ORDINANCE: "B",
  ADMIN_RULE: "C",
  INTERPRETATION: "D",
  ASSOCIATION_GUIDE: "E",
  MEMBER_CASE: "F",
};

const CHUNK_TYPE: Record<string, string> = {
  LAW: "LAW_ARTICLE",
  ORDINANCE: "LAW_ARTICLE",
  ADMIN_RULE: "LAW_ARTICLE",
  INTERPRETATION: "LAW_ARTICLE",
  ASSOCIATION_GUIDE: "GUIDE_TOPIC",
  MEMBER_CASE: "CASE_SITUATION",
};

type IndexDoc = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  securityClass: string;
  version: { versionNo: number; effectiveFrom: string | null; rawObjectPath: string };
  chunks: { text: string; embedding: number[] }[];
};

async function main() {
  const index = JSON.parse(
    readFileSync(resolve(process.cwd(), "data/khba-index.json"), "utf8"),
  ) as { documents: IndexDoc[] };

  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const client = postgres(process.env.DATABASE_URL, {
    ssl: "require",
    prepare: false,
    max: 1,
    connect_timeout: 15,
    idle_timeout: 5,
  });
  const db = drizzle(client);

  try {
    const codes = index.documents.map((d) => d.documentCode);
    // Idempotent: remove prior versions of these documents (cascades to
    // versions, nodes, and evidence via FK onDelete).
    await db.delete(document).where(inArray(document.documentCode, codes));

    let evidenceCount = 0;

    for (const doc of index.documents) {
      const [docRow] = await db
        .insert(document)
        .values({
          documentCode: doc.documentCode,
          title: doc.title,
          authorityType: doc.authorityType as never,
          jurisdictionCode: doc.jurisdictionCode,
          securityClass: doc.securityClass as never,
        })
        .returning({ id: document.documentId });

      const sourceHash = createHash("sha256")
        .update(`${doc.documentCode}:${doc.version.rawObjectPath}`)
        .digest("hex");

      const [verRow] = await db
        .insert(documentVersion)
        .values({
          documentId: docRow.id,
          versionNo: doc.version.versionNo,
          effectiveFrom: doc.version.effectiveFrom,
          sourceHash,
          rawObjectPath: doc.version.rawObjectPath,
          approvalStatus: "PUBLISHED",
        })
        .returning({ id: documentVersion.versionId });

      for (let i = 0; i < doc.chunks.length; i++) {
        const chunk = doc.chunks[i];
        const nodePath = `${doc.documentCode}#${i + 1}`;

        const [nodeRow] = await db
          .insert(contentNode)
          .values({
            versionId: verRow.id,
            nodePath,
            chunkType: (CHUNK_TYPE[doc.authorityType] ?? "GUIDE_TOPIC") as never,
          })
          .returning({ id: contentNode.nodeId });

        const vectorLiteral = `[${chunk.embedding.join(",")}]`;

        await db.insert(sourceEvidence).values({
          versionId: verRow.id,
          nodeId: nodeRow.id,
          originalText: chunk.text,
          locatorJson: { chunkIndex: i, nodePath },
          evidenceGrade: GRADE[doc.authorityType] ?? "F",
          citationLabel: chunk.text.slice(0, 120),
          embeddingVersion: EMBEDDING_MODEL_ID,
          // Explicit cast avoids the pgvector text->halfvec param gotcha.
          evidenceEmbedding: sql`${vectorLiteral}::halfvec(${sql.raw(String(EMBEDDING_DIMENSIONS))})`,
          indexStatus: "INDEXED",
        });
        evidenceCount++;
      }

      console.log(`  seeded ${doc.documentCode.padEnd(20)} ${doc.chunks.length} evidence`);
    }

    console.log(
      `\nSeeded ${index.documents.length} documents, ${evidenceCount} evidence rows.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
