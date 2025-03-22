import type { Storage } from "@/server/storage";
import {
  AuthService,
  CompanyService,
  AIService,
  AccountingService,
} from "./implementations";
import type {
  IAuthService,
  ICompanyService,
  IAIService,
  IAccountingService,
} from "./interfaces";
import type { QuickBooksConfig, PlaidConfig } from "./implementations/company";
export class Service {
  readonly auth: IAuthService;
  readonly company: ICompanyService;
  readonly ai: IAIService;
  readonly accounting: IAccountingService;

  constructor(
    storage: Storage,
    qbConfig: QuickBooksConfig,
    plaidConfig: PlaidConfig,
    openaiKey: string
  ) {
    const company = new CompanyService(storage, plaidConfig, qbConfig);
    const accounting = new AccountingService(storage.accounting, company, qbConfig.environment);

    this.auth = new AuthService(storage.account);
    this.company = company;
    this.accounting = accounting;
    this.ai = new AIService(accounting, openaiKey);
  }
}

export * from "./interfaces";
export * from "./implementations";
