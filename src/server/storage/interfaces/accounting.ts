import type {
  PlaidBankAccount,
  CreatePlaidBankAccountParams,
  CreatePlaidTransactionParams,
  UpdatePlaidBankAccountParams,
  PlaidTransaction,
  CreateQuickBooksInvoiceParams,
  QuickBooksInvoice,
} from "../../entities";

export interface IAccountingRepository {
  upsertBankAccount(
    params: CreatePlaidBankAccountParams,
    companyId: number,
  ): Promise<PlaidBankAccount>;
  getBankAccountByRemoteId(id: string): Promise<PlaidBankAccount>;
  getBankAccountsByCompanyId(companyId: number): Promise<PlaidBankAccount[]>;
  deleteBankAccount(id: string): Promise<void>;

  upsertTransaction(
    params: CreatePlaidTransactionParams | CreatePlaidTransactionParams[],
    companyId: number,
  ): Promise<void>;
  getTransactionById(id: string): Promise<PlaidTransaction | undefined>;
  getTransactionsByBankAccountId(
    bankAccountId: string,
  ): Promise<PlaidTransaction[]>;
  deleteTransaction(id: string | string[]): Promise<void>;

  upsertInvoice(
    params: CreateQuickBooksInvoiceParams,
    companyId: number,
  ): Promise<QuickBooksInvoice>;
  getInvoiceById(id: number): Promise<QuickBooksInvoice | undefined>;
  getInvoicesByCompanyId(companyId: number): Promise<QuickBooksInvoice[]>;
  deleteInvoiceByRemoteId(remoteId: string | string[]): Promise<void>;
}
