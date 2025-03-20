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
import type { DB } from "@/lib/db/client";

export class Storage {
  public readonly account: IAccountRepository;
  public readonly company: ICompanyRepository;
  public readonly accounting: IAccountingRepository;
  private readonly db: DB;

  constructor(db: DB) {
    this.db = db;

    this.account = new AccountRepository(this.db);
    this.company = new CompanyRepository(this.db);
    this.accounting = new AccountingRepository(this.db);
  }
}
