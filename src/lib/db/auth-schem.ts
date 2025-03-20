import { pgSchema, uuid } from "drizzle-orm/pg-core";

// Little workaround
export const users = pgSchema("auth").table("users", {
  id: uuid("id").primaryKey(),
});
