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
})