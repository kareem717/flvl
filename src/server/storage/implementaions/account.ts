import type { Account, CreateAccountParams } from "@/lib/db/types";
import type { IAccountRepository } from "../interfaces";
import type { DB } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export class AccountRepository implements IAccountRepository {
  constructor(private readonly db: DB) { }

  async getByUserId(id: string): Promise<Account | undefined> {
    const [data] = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, id));

    if (!data) {
      return undefined;
    }

    return data;
  }

  async create(params: CreateAccountParams): Promise<Account> {
    const [data] = await this.db
      .insert(accounts)
      .values(params)
      .returning();

    if (!data) {
      throw new Error("Failed to create account");
    }

    return data;
  }

  async getById(id: number): Promise<Account | undefined> {
    const [data] = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id));

    if (!data) {
      return undefined;
    }

    return data;
  }
}
