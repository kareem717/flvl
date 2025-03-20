import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "@/lib/db/schema"

export const db = (url: string) => drizzle(neon(url), { schema })

export type DB = ReturnType<typeof db>