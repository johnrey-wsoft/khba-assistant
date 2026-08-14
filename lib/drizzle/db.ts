import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/drizzle/schemas";

const client = postgres(process.env.DATABASE_URL!, {
  // Supabase pooler (transaction mode, port 6543) requires SSL and no prepared
  // statements.
  ssl: "require",
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Pass the schema so the relational query API (db.query.*) is available in
// addition to the core query builder (db.select / db.insert / db.execute).
export const db = drizzle(client, { schema });
