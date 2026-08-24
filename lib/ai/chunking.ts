import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { embedTexts } from "./embeddings";

export type SemanticChunkOptions = {
  // Adjacent units whose cosine distance is below this are merged into one
  // chunk (semantically continuous); above it starts a new chunk.
  mergeThreshold?: number;
  // Hard cap; a merge that would exceed this is not performed.
  maxChunkChars?: number;
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

// A GFM table delimiter row, e.g. "| --- | :--: |" — the line that makes the
// rows around it render as a table.
const isTableDelimiterLine = (line: string): boolean => {
  const t = line.trim();
  return t.includes("|") && t.includes("-") && /^[|\-:\s]+$/.test(t);
};

// A unit that contains a markdown table. Such units must stay intact: splitting
// one (separating its header/delimiter from the body rows) or gluing it onto
// neighbouring prose without a blank line stops it rendering as a table.
const isTableBlock = (s: string): boolean => s.split("\n").some(isTableDelimiterLine);

// Base units: paragraphs (blank-line separated) are the natural unit for
// legal/administrative text; langchain sub-splits any paragraph over the cap.
const toBaseUnits = async (text: string, maxChunkChars: number): Promise<string[]> => {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const source = paragraphs.length > 1 ? paragraphs : [text];
  const longSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: maxChunkChars,
    chunkOverlap: 0,
    separators: ["\n", "。", ". ", "! ", "? ", "；", "; ", " ", ""],
  });

  const units: string[] = [];
  for (const part of source) {
    // Never sub-split a table: its rows must stay together to render, and a
    // long-splitter cut on "\n" would strand the body rows from the delimiter.
    if (part.length <= maxChunkChars || isTableBlock(part)) {
      units.push(part);
    } else {
      const pieces = (await longSplitter.splitText(part)).map((u) => u.trim()).filter(Boolean);
      units.push(...pieces);
    }
  }
  return units;
};

// Semantic chunking:
//   1. langchain produces base units (paragraphs, long ones sub-split),
//   2. Vercel AI SDK embeds each unit (text-embedding-3-small),
//   3. adjacent units are merged while they stay semantically close, and a
//      new chunk starts when the topic shifts (cosine distance jumps).
export const semanticChunk = async (
  text: string,
  { mergeThreshold = 0.12, maxChunkChars = 1200 }: SemanticChunkOptions = {}
): Promise<string[]> => {
  const clean = text.trim();
  if (!clean) return [];

  const units = await toBaseUnits(clean, maxChunkChars);
  if (units.length <= 1) return units.length ? units : [];

  const embeddings = await embedTexts(units);

  const chunks: string[] = [units[0]];
  for (let i = 1; i < units.length; i++) {
    const distance = 1 - cosineSimilarity(embeddings[i - 1], embeddings[i]);
    // Join merged units with a blank line, not a space: units are markdown
    // blocks (paragraphs, tables, lists), and block syntax — a table in
    // particular — only parses when separated by a blank line.
    const combinedLength = chunks[chunks.length - 1].length + 2 + units[i].length;
    if (distance < mergeThreshold && combinedLength <= maxChunkChars) {
      chunks[chunks.length - 1] = `${chunks[chunks.length - 1]}\n\n${units[i]}`;
    } else {
      chunks.push(units[i]);
    }
  }
  return chunks;
};
