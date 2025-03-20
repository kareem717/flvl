import type { Account, CreateAccountParams } from "@/lib/db/types";

export interface IAccountRepository {
  getByUserId(id: string): Promise<Account | undefined>;

  create(account: CreateAccountParams): Promise<Account>;

  getById(id: number): Promise<Account | undefined>;
}
