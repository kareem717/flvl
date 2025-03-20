import type { Account, CreateAccountParams } from "@/lib/db/types";

export interface IAuthService {
  createAccount(account: CreateAccountParams): Promise<Account>;
  getAccountByUserId(userId: string): Promise<Account | null>;
}
