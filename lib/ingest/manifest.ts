import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type ManifestEntry = {
  file: string; // relative to data/
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode?: string | null;
  securityClass?: string;
  version?: { versionNo?: number; effectiveFrom?: string | null };
};

const MANIFEST_PATH = resolve(process.cwd(), "data/ingest/manifest.json");
const DATA_DIR = resolve(process.cwd(), "data");

export const loadManifest = (): ManifestEntry[] => {
  const raw = readFileSync(MANIFEST_PATH, "utf8");
  return (JSON.parse(raw) as { documents: ManifestEntry[] }).documents;
};

export const resolveDocumentPath = (file: string): string => resolve(DATA_DIR, file);
