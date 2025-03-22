import { drizzle } from 'drizzle-orm/neon-serverless';
import { NeonHttpQueryResultHKT } from "drizzle-orm/neon-http"
import * as schema from "@/lib/db/schema"
import { PgTransaction } from "drizzle-orm/pg-core"
import { ExtractTablesWithRelations } from "drizzle-orm"
import ws from 'ws';

export const db = (url: string) => {
  const db = drizzle({
    connection: url,
    ws: ws,
  });

  return db;
}

export type DB = ReturnType<typeof db>
export type Transaction = PgTransaction<NeonHttpQueryResultHKT, typeof import("@/lib/db/schema"), ExtractTablesWithRelations<typeof import("@/lib/db/schema")>>