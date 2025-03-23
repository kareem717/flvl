import { j, accountProcedure } from "../jstack"
import { HTTPException } from "hono/http-exception"
import { intIdSchema, stringIdSchema } from "./shared"
import { z } from "zod"

//TODO: verify user has access to the company
export const accountingHandler = j.router({
  companyBankAccounts: accountProcedure
    .input(z.object({ companyId: intIdSchema }))
    .query(async ({ c, ctx, input: { companyId } }) => {
      const { service, account } = ctx
      const company = await service.company.getById(companyId)

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this account"
        })
      }

      const bankAccounts = await service.accounting.getBankAccountsForCompany(company.id)

      return c.superjson(bankAccounts)
    }),
  getBankAccount: accountProcedure
    .input(z.object({ bankAccountId: stringIdSchema }))
    .query(async ({ ctx, c, input: { bankAccountId } }) => {
      const { service, account } = ctx
      const bankAccount = await service.accounting.getBankAccountDetails(bankAccountId);

      const company = await service.company.getById(bankAccount.companyId)

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this account"
        })
      }

      return c.json(bankAccount);
    }),
  getTransactionsByBankAccountId: accountProcedure
    .input(z.object({ bankAccountId: stringIdSchema }))
    .query(async ({ ctx, c, input: { bankAccountId } }) => {
      const { service, account } = ctx
      const bankAccount = await service.accounting.getBankAccountDetails(bankAccountId);

      const company = await service.company.getById(bankAccount.companyId)

      if (company.ownerId !== account.id) {
        throw new HTTPException(403, {
          message: "Forbidden from managing this account"
        })
      }

      const transactions = await service.accounting.getTransactionsByBankAccountId(bankAccount.remoteId);

      return c.superjson(transactions);
    }),
  getInvoice: accountProcedure
    .input(z.object({ invoiceId: intIdSchema }))
    .query(async ({ ctx, c, input: { invoiceId } }) => {
      const { service, account } = ctx
      const invoice = await service.accounting.getInvoice(invoiceId);

      return c.superjson(invoice);
    }),
  getInvoicesByCompanyId: accountProcedure
    .input(z.object({ companyId: intIdSchema }))
    .query(async ({ ctx, c, input: { companyId } }) => {
      const { service, account } = ctx
      const invoices = await service.accounting.getInvoicesByCompanyId(companyId);

      return c.superjson(invoices);
    }),
  getAccountingAccount: accountProcedure
    .input(z.object({ accountId: intIdSchema }))
    .query(async ({ ctx, c, input: { accountId } }) => {
      const { service, account } = ctx
      const accountingAccount = await service.accounting.getAccountingAccount(accountId);

      return c.superjson(accountingAccount);
    }),
  getAccountingAccountsByCompanyId: accountProcedure
    .input(z.object({ companyId: intIdSchema }))
    .query(async ({ ctx, c, input: { companyId } }) => {
      const { service, account } = ctx
      const accounts = await service.accounting.getAccountingAccountsByCompanyId(companyId);

      return c.superjson(accounts);
    }),
  getAccountingTransaction: accountProcedure
    .input(z.object({ transactionId: intIdSchema }))
    .query(async ({ ctx, c, input: { transactionId } }) => {
      const { service, account } = ctx
      const transaction = await service.accounting.getAccountingTransaction(transactionId);

      return c.superjson(transaction);
    }),
  getAccountingTransactionsByCompanyId: accountProcedure
    .input(z.object({ companyId: intIdSchema }))
    .query(async ({ ctx, c, input: { companyId } }) => {
      const { service, account } = ctx
      const transactions = await service.accounting.getAccountingTransactionsByCompanyId(companyId);

      return c.superjson(transactions);
    }),
  getJournalEntry: accountProcedure
    .input(z.object({ journalEntryId: intIdSchema }))
    .query(async ({ ctx, c, input: { journalEntryId } }) => {
      const { service, account } = ctx
      const journalEntry = await service.accounting.getJournalEntry(journalEntryId);

      return c.superjson(journalEntry);
    }),
  getJournalEntriesByCompanyId: accountProcedure
    .input(z.object({ companyId: intIdSchema }))
    .query(async ({ ctx, c, input: { companyId } }) => {
      const { service, account } = ctx
      const journalEntries = await service.accounting.getJournalEntriesByCompanyId(companyId);

      return c.superjson(journalEntries);
    }),
  getVendorCredit: accountProcedure
    .input(z.object({ vendorCreditId: intIdSchema }))
    .query(async ({ ctx, c, input: { vendorCreditId } }) => {
      const { service, account } = ctx
      const vendorCredit = await service.accounting.getVendorCredit(vendorCreditId);

      return c.superjson(vendorCredit);
    }),
  getVendorCreditsByCompanyId: accountProcedure
    .input(z.object({ companyId: intIdSchema }))
    .query(async ({ ctx, c, input: { companyId } }) => {
      const { service, account } = ctx
      const vendorCredits = await service.accounting.getVendorCreditsByCompanyId(companyId);

      return c.superjson(vendorCredits);
    }),
  getCreditNote: accountProcedure
    .input(z.object({ creditNoteId: intIdSchema }))
    .query(async ({ ctx, c, input: { creditNoteId } }) => {
      const { service, account } = ctx
      const creditNote = await service.accounting.getCreditNote(creditNoteId);

      return c.superjson(creditNote);
    }),
  getCreditNotesByCompanyId: accountProcedure
    .input(z.object({ companyId: intIdSchema }))
    .query(async ({ ctx, c, input: { companyId } }) => {
      const { service, account } = ctx
      const creditNotes = await service.accounting.getCreditNotesByCompanyId(companyId);

      return c.superjson(creditNotes);
    }),
  getPayment: accountProcedure
    .input(z.object({ paymentId: intIdSchema }))
    .query(async ({ ctx, c, input: { paymentId } }) => {
      const { service, account } = ctx
      const payment = await service.accounting.getPayment(paymentId);

      return c.superjson(payment);
    }),
  getPaymentsByCompanyId: accountProcedure
    .input(z.object({ companyId: intIdSchema }))
    .query(async ({ ctx, c, input: { companyId } }) => {
      const { service, account } = ctx
      const payments = await service.accounting.getPaymentsByCompanyId(companyId);

      return c.superjson(payments);
    }),
})