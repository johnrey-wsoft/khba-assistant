// Tiny structured logger shared by the CLI (`scripts/ingest.ts`) and the durable
// workflow steps (`workflows/ingest.ts`), so ingestion is trackable the same way
// from either entry point. Lines are greppable: `[ingest:<scope>] <message> k=v`.
//
// Only ever called from steps / scripts (never the workflow orchestrator), so
// Date.now() here is safe — it does not run in the replay-deterministic path.

export const logIngest = (scope: string, message: string, data?: Record<string, unknown>): void => {
  const kv = data
    ? " " +
      Object.entries(data)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ")
    : "";
  console.log(`[ingest:${scope}] ${message}${kv}`);
};

// Human-friendly elapsed time since a Date.now() start marker.
export const since = (start: number): string => `${((Date.now() - start) / 1000).toFixed(1)}s`;
