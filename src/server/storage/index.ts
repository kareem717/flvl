import type {
  IAccountRepository,
  ICompanyRepository,
  IAccountingRepository,
} from "./interfaces";
import {
  CompanyRepository,
  AccountRepository,
  AccountingRepository,
} from "./implementaions";
import type { DB, Transaction } from "@/lib/db/client";

export type IDB = DB | Transaction;

export class Storage {
  public readonly account: IAccountRepository;
  public readonly company: ICompanyRepository;
  public readonly accounting: IAccountingRepository;
  private readonly db: IDB;

  constructor(db: IDB) {
    this.db = db;

    this.account = new AccountRepository(this.db);
    this.company = new CompanyRepository(this.db);
    this.accounting = new AccountingRepository(this.db);
  }

  async runInTransaction<T>(fn: (db: IDB) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      return fn(tx);
    });
  }
}

