import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

// OpenAI text-embedding-3-small → 1536 dims, matches
// EVIDENCE_EMBEDDING_DIMENSIONS on the source_evidence halfvec column.
export const EMBEDDING_MODEL_ID = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

const embeddingModel = openai.embedding(EMBEDDING_MODEL_ID);

export const embedText = async (value: string): Promise<number[]> => {
  const { embedding } = await embed({ model: embeddingModel, value });
  return embedding;
};

export const embedTexts = async (values: string[]): Promise<number[][]> => {
  if (values.length === 0) return [];
  const { embeddings } = await embedMany({ model: embeddingModel, values });
  return embeddings;
};
